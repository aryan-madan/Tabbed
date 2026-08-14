import os
from dotenv import load_dotenv
import secrets
from functools import wraps

import requests
import psycopg2
import psycopg2.extras
from psycopg2 import pool as pg_pool
from authlib.integrations.flask_client import OAuth
from flask import (
    Flask, redirect, url_for, session, request,
    jsonify, render_template, flash, abort, g
)

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", secrets.token_hex(32))

DATABASE_URL = os.environ["DATABASE_URL"]

# Optional. If set, purchase details get POSTed here as JSON right after a
# successful buy. Leave unset to skip webhook calls entirely.
PURCHASE_WEBHOOK_URL = os.environ.get("PURCHASE_WEBHOOK_URL", "").strip()

# Reuse a small pool of connections instead of opening a fresh TCP+TLS
# connection to postgres on every query. This is the single biggest
# latency win for anything hitting a remote/serverless DB (e.g. Neon).
db_pool = pg_pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=DATABASE_URL,
    cursor_factory=psycopg2.extras.RealDictCursor,
)

HACKCLUB_CLIENT_ID = os.environ["HACKCLUB_CLIENT_ID"]
HACKCLUB_CLIENT_SECRET = os.environ["HACKCLUB_CLIENT_SECRET"]
HACKCLUB_DISCOVERY_URL = "https://auth.hackclub.com/.well-known/openid-configuration"

# slack_ids that get is_admin=True the first time their user row is created.
# after that admin status just lives in the DB, this list doesn't matter anymore.
SEED_ADMIN_SLACK_IDS = set(
    s.strip() for s in os.environ.get("SEED_ADMIN_SLACK_IDS", "").split(",") if s.strip()
)

oauth = OAuth(app)
oauth.register(
    name="hackclub",
    client_id=HACKCLUB_CLIENT_ID,
    client_secret=HACKCLUB_CLIENT_SECRET,
    server_metadata_url=HACKCLUB_DISCOVERY_URL,
    client_kwargs={"scope": "openid profile email slack_id verification_status"},
)


def get_db():
    # One pooled connection per request, stashed on `g` so repeated calls
    # within the same request reuse it instead of grabbing another.
    if "db_conn" not in g:
        g.db_conn = db_pool.getconn()
    return g.db_conn


@app.teardown_appcontext
def release_db(exception=None):
    conn = g.pop("db_conn", None)
    if conn is not None:
        if exception is not None:
            conn.rollback()
        db_pool.putconn(conn)


def init_db():
    # Runs at startup, outside any request context, so it can't use get_db()
    # (which relies on Flask's `g`). Pull straight from the pool instead.
    conn = db_pool.getconn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            slack_id TEXT UNIQUE NOT NULL,
            name TEXT,
            email TEXT,
            hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price_hours NUMERIC(10, 2) NOT NULL,
            stock INTEGER NOT NULL DEFAULT -1,
            image_url TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            slack_id TEXT NOT NULL REFERENCES users(slack_id),
            product_id INTEGER NOT NULL REFERENCES products(id),
            product_name TEXT NOT NULL,
            price_hours NUMERIC(10, 2) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS hour_adjustments (
            id SERIAL PRIMARY KEY,
            slack_id TEXT NOT NULL REFERENCES users(slack_id),
            delta_hours NUMERIC(10, 2) NOT NULL,
            reason TEXT,
            adjusted_by_slack_id TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)
    conn.commit()
    cur.close()
    db_pool.putconn(conn)


def send_purchase_webhook(payload):
    if not PURCHASE_WEBHOOK_URL:
        return
    try:
        requests.post(PURCHASE_WEBHOOK_URL, json=payload, timeout=5)
    except requests.RequestException as e:
        # don't let a flaky webhook endpoint break the purchase flow
        app.logger.warning(f"purchase webhook failed: {e}")


def get_or_create_user(slack_id, name=None, email=None):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE slack_id = %s", (slack_id,))
    user = cur.fetchone()

    if user is None:
        is_admin = slack_id in SEED_ADMIN_SLACK_IDS
        cur.execute(
            "INSERT INTO users (slack_id, name, email, is_admin) VALUES (%s, %s, %s, %s) RETURNING *",
            (slack_id, name, email, is_admin),
        )
        user = cur.fetchone()
        conn.commit()
    else:
        # only refreshing name/email here, hours and is_admin stay untouched
        cur.execute(
            "UPDATE users SET name = %s, email = %s, updated_at = NOW() WHERE slack_id = %s RETURNING *",
            (name, email, slack_id),
        )
        user = cur.fetchone()
        conn.commit()

    cur.close()
    return user


def get_user_by_slack_id(slack_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE slack_id = %s", (slack_id,))
    user = cur.fetchone()
    cur.close()
    return user


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "slack_id" not in session:
            return redirect(url_for("login", next=request.path))
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "slack_id" not in session:
            return redirect(url_for("login", next=request.path))
        user = get_user_by_slack_id(session["slack_id"])
        if not user or not user["is_admin"]:
            abort(403)
        return f(*args, **kwargs)
    return wrapper


def current_user():
    if "slack_id" not in session:
        return None
    return get_user_by_slack_id(session["slack_id"])


@app.route("/login")
def login():
    session["post_login_redirect"] = request.args.get("next", "/")
    redirect_uri = url_for("auth_callback", _external=True)
    return oauth.hackclub.authorize_redirect(redirect_uri)


@app.route("/auth/callback")
def auth_callback():
    token = oauth.hackclub.authorize_access_token()

    # authlib checks the id_token signature/claims against the JWKS from
    # the discovery doc automatically, so no manual verification needed here
    userinfo = token.get("userinfo")
    if not userinfo:
        userinfo = oauth.hackclub.userinfo(token=token)

    slack_id = userinfo.get("slack_id")
    if not slack_id:
        flash("Hack Club Auth did not return a slack_id. Check your app's scopes.")
        return redirect(url_for("index"))

    name = userinfo.get("name")
    email = userinfo.get("email")

    get_or_create_user(slack_id, name=name, email=email)

    session["slack_id"] = slack_id
    session["name"] = name

    next_url = session.pop("post_login_redirect", "/")
    return redirect(next_url)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


@app.route("/")
def index():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC")
    products = cur.fetchall()
    cur.close()

    return render_template("index.html", products=products, user=current_user())


@app.route("/buy/<int:product_id>", methods=["POST"])
@login_required
def buy(product_id):
    slack_id = session["slack_id"]

    conn = get_db()
    cur = conn.cursor()
    try:
        # lock both rows so two concurrent buys can't double-spend the same hours
        cur.execute("BEGIN")
        cur.execute("SELECT * FROM products WHERE id = %s FOR UPDATE", (product_id,))
        product = cur.fetchone()
        if not product or not product["is_active"]:
            conn.rollback()
            flash("Product not available.")
            return redirect(url_for("index"))

        cur.execute("SELECT * FROM users WHERE slack_id = %s FOR UPDATE", (slack_id,))
        user = cur.fetchone()

        if product["stock"] != -1 and product["stock"] <= 0:
            conn.rollback()
            flash("This product is out of stock.")
            return redirect(url_for("index"))

        if user["hours"] < product["price_hours"]:
            conn.rollback()
            flash("You don't have enough hours for this.")
            return redirect(url_for("index"))

        cur.execute(
            "UPDATE users SET hours = hours - %s, updated_at = NOW() WHERE slack_id = %s",
            (product["price_hours"], slack_id),
        )

        if product["stock"] != -1:
            cur.execute("UPDATE products SET stock = stock - 1 WHERE id = %s", (product_id,))

        cur.execute(
            """
            INSERT INTO orders (slack_id, product_id, product_name, price_hours)
            VALUES (%s, %s, %s, %s)
            RETURNING id, created_at
            """,
            (slack_id, product_id, product["name"], product["price_hours"]),
        )
        order = cur.fetchone()

        conn.commit()
        flash(f"Purchased {product['name']} for {product['price_hours']} hours!")
    except Exception:
        conn.rollback()
        flash("Something went wrong with your purchase.")
        raise
    finally:
        cur.close()

    send_purchase_webhook({
        "order_id": order["id"],
        "slack_id": slack_id,
        "buyer_name": user["name"],
        "buyer_email": user["email"],
        "product_id": product["id"],
        "product_name": product["name"],
        "price_hours": float(product["price_hours"]),
        "purchased_at": order["created_at"].isoformat(),
    })

    return redirect(url_for("index"))


@app.route("/me/orders")
@login_required
def my_orders():
    slack_id = session["slack_id"]
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM orders WHERE slack_id = %s ORDER BY created_at DESC", (slack_id,))
    orders = cur.fetchall()
    cur.close()
    return render_template("orders.html", orders=orders, user=current_user())


@app.route("/admin")
@admin_required
def admin_dashboard():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products ORDER BY created_at DESC")
    products = cur.fetchall()
    cur.execute("SELECT * FROM users ORDER BY created_at DESC")
    users = cur.fetchall()
    cur.close()
    return render_template("admin.html", products=products, users=users)


@app.route("/admin/products/add", methods=["POST"])
@admin_required
def admin_add_product():
    name = request.form.get("name", "").strip()
    description = request.form.get("description", "").strip()
    price_hours = request.form.get("price_hours", "").strip()
    stock = request.form.get("stock", "-1").strip()
    image_url = request.form.get("image_url", "").strip()

    if not name or not price_hours:
        flash("Name and price (in hours) are required.")
        return redirect(url_for("admin_dashboard"))

    try:
        price_hours = float(price_hours)
        stock = int(stock) if stock else -1
    except ValueError:
        flash("Price must be a number and stock must be an integer.")
        return redirect(url_for("admin_dashboard"))

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO products (name, description, price_hours, stock, image_url) VALUES (%s, %s, %s, %s, %s)",
        (name, description, price_hours, stock, image_url or None),
    )
    conn.commit()
    cur.close()

    flash(f"Added product '{name}'.")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/products/<int:product_id>/toggle", methods=["POST"])
@admin_required
def admin_toggle_product(product_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE products SET is_active = NOT is_active WHERE id = %s", (product_id,))
    conn.commit()
    cur.close()
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/products/<int:product_id>/delete", methods=["POST"])
@admin_required
def admin_delete_product(product_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
    conn.commit()
    cur.close()
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/users/adjust-hours", methods=["POST"])
@admin_required
def admin_adjust_hours():
    target_slack_id = request.form.get("slack_id", "").strip()
    delta = request.form.get("delta_hours", "").strip()
    reason = request.form.get("reason", "").strip()

    if not target_slack_id or not delta:
        flash("slack_id and delta_hours are required.")
        return redirect(url_for("admin_dashboard"))

    try:
        delta = float(delta)
    except ValueError:
        flash("delta_hours must be a number (can be negative).")
        return redirect(url_for("admin_dashboard"))

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE slack_id = %s", (target_slack_id,))
    user = cur.fetchone()
    if not user:
        # lets admins pre-load hours for someone before they've ever logged in
        cur.execute("INSERT INTO users (slack_id, hours) VALUES (%s, 0) RETURNING *", (target_slack_id,))
        user = cur.fetchone()

    cur.execute(
        "UPDATE users SET hours = hours + %s, updated_at = NOW() WHERE slack_id = %s",
        (delta, target_slack_id),
    )
    cur.execute(
        "INSERT INTO hour_adjustments (slack_id, delta_hours, reason, adjusted_by_slack_id) VALUES (%s, %s, %s, %s)",
        (target_slack_id, delta, reason or None, session["slack_id"]),
    )

    conn.commit()
    cur.close()

    flash(f"Adjusted {target_slack_id} by {delta} hours.")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/users/<slack_id>/toggle-admin", methods=["POST"])
@admin_required
def admin_toggle_admin(slack_id):
    if slack_id == session["slack_id"]:
        flash("You can't change your own admin status.")
        return redirect(url_for("admin_dashboard"))

    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET is_admin = NOT is_admin WHERE slack_id = %s", (slack_id,))
    conn.commit()
    cur.close()
    return redirect(url_for("admin_dashboard"))


@app.route("/api/me")
@login_required
def api_me():
    user = current_user()
    return jsonify({
        "slack_id": user["slack_id"],
        "name": user["name"],
        "email": user["email"],
        "hours": float(user["hours"]),
        "is_admin": user["is_admin"],
    })


@app.route("/api/products")
def api_products():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC")
    products = cur.fetchall()
    cur.close()
    return jsonify([{
        "id": p["id"],
        "name": p["name"],
        "description": p["description"],
        "price_hours": float(p["price_hours"]),
        "stock": p["stock"],
        "image_url": p["image_url"],
    } for p in products])


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
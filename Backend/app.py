import os
import secrets
from functools import wraps

import psycopg2
import psycopg2.extras
import requests
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
from flask import Flask, abort, jsonify, redirect, request, session, url_for
from psycopg2 import pool

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET", secrets.token_hex(32))
frontend = os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
dburl = os.environ["DATABASE"]
hook = os.environ.get("WEBHOOK", "").strip()
admins = {val.strip() for val in os.environ.get("ADMINS", "").split(",") if val.strip()}
db = pool.ThreadedConnectionPool(1, 10, dsn=dburl, cursor_factory=psycopg2.extras.RealDictCursor)
oauth = OAuth(app)


def resolve_redirect(path):
    path = path or "/"
    if path.startswith(("http://", "https://")):
        return path
    if path.startswith("/"):
        return f"{frontend}{path}"
    return f"{frontend}/{path}"
oauth.register(
    name="hackclub",
    client_id=os.environ["CLIENT"],
    client_secret=os.environ["CLIENTSECRET"],
    server_metadata_url="https://auth.hackclub.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid profile email slack_id verification_status"},
)


def conn():
    return db.getconn()


def done(sql):
    sql.close()


def init():
    con = conn()
    cur = con.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, slack_id TEXT UNIQUE NOT NULL, name TEXT, email TEXT, hours NUMERIC(10,2) NOT NULL DEFAULT 0, is_admin BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())")
    cur.execute("CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT, price_hours NUMERIC(10,2) NOT NULL, stock INTEGER NOT NULL DEFAULT -1, image_url TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())")
    cur.execute("CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, slack_id TEXT NOT NULL REFERENCES users(slack_id), product_id INTEGER NOT NULL REFERENCES products(id), product_name TEXT NOT NULL, price_hours NUMERIC(10,2) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())")
    cur.execute("CREATE TABLE IF NOT EXISTS hour_adjustments (id SERIAL PRIMARY KEY, slack_id TEXT NOT NULL REFERENCES users(slack_id), delta_hours NUMERIC(10,2) NOT NULL, reason TEXT, adjusted_by_slack_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())")
    con.commit()
    done(cur)
    db.putconn(con)


def user():
    sid = session.get("slack")
    if not sid:
        return None
    con = conn()
    cur = con.cursor()
    cur.execute("SELECT slack_id AS slack, name, email, hours, is_admin AS admin FROM users WHERE slack_id = %s", (sid,))
    val = cur.fetchone()
    done(cur)
    db.putconn(con)
    return val


def login(fun):
    @wraps(fun)
    def wrap(*args, **kwargs):
        if not session.get("slack"):
            return jsonify({"error": "signin required"}), 401
        return fun(*args, **kwargs)
    return wrap


def admin(fun):
    @wraps(fun)
    def wrap(*args, **kwargs):
        val = user()
        if not val or not val["admin"]:
            abort(403)
        return fun(*args, **kwargs)
    return wrap


def data(val):
    return {"id": val["id"], "name": val["name"], "descr": val["descr"], "price": float(val["price"]), "stock": val["stock"], "image": val["image"], "active": val["active"]}


@app.route("/login")
def signin():
    session["next"] = request.args.get("next") or "/shop"
    uri = url_for("callback", _external=True)
    return oauth.hackclub.authorize_redirect(uri)


@app.route("/oauth/callback")
def callback():
    tok = oauth.hackclub.authorize_access_token()
    info = tok.get("userinfo") or oauth.hackclub.userinfo(token=tok)
    sid = info.get("slack_id")
    if not sid:
        return redirect(resolve_redirect("/"))
    con = conn()
    cur = con.cursor()
    cur.execute("INSERT INTO users (slack_id, name, email, is_admin) VALUES (%s, %s, %s, %s) ON CONFLICT (slack_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = NOW()", (sid, info.get("name"), info.get("email"), sid in admins))
    con.commit()
    done(cur)
    db.putconn(con)
    session["slack"] = sid
    return redirect(resolve_redirect(session.pop("next", "/shop")))


@app.route("/logout")
def signout():
    session.clear()
    return redirect(resolve_redirect("/"))


@app.route("/api/products")
def products():
    con = conn()
    cur = con.cursor()
    cur.execute("SELECT id, name, description AS descr, price_hours AS price, stock, image_url AS image, is_active AS active FROM products WHERE is_active = TRUE ORDER BY created_at DESC")
    vals = cur.fetchall()
    done(cur)
    db.putconn(con)
    return jsonify([data(val) for val in vals])


@app.route("/api/me")
def me():
    val = user()
    if not val:
        return jsonify(None)
    return jsonify({"name": val["name"], "hours": float(val["hours"]), "admin": val["admin"]})


@app.route("/api/buy/<int:pid>", methods=["POST"])
@login
def buy(pid):
    sid = session["slack"]
    con = conn()
    cur = con.cursor()
    try:
        cur.execute("SELECT id, name, description AS descr, price_hours AS price, stock, image_url AS image, is_active AS active FROM products WHERE id = %s AND is_active = TRUE FOR UPDATE", (pid,))
        item = cur.fetchone()
        cur.execute("SELECT slack_id AS slack, name, email, hours, is_admin AS admin FROM users WHERE slack_id = %s FOR UPDATE", (sid,))
        val = cur.fetchone()
        if not item or item["stock"] == 0 or val["hours"] < item["price"]:
            con.rollback()
            return jsonify({"error": "unavailable"}), 400
        cur.execute("UPDATE users SET hours = hours - %s, updated_at = NOW() WHERE slack_id = %s", (item["price"], sid))
        if item["stock"] != -1:
            cur.execute("UPDATE products SET stock = stock - 1 WHERE id = %s", (pid,))
        cur.execute("INSERT INTO orders (slack_id, product_id, product_name, price_hours) VALUES (%s, %s, %s, %s) RETURNING id", (sid, pid, item["name"], item["price"]))
        order = cur.fetchone()
        con.commit()
    finally:
        done(cur)
        db.putconn(con)
    if hook:
        try:
            requests.post(hook, json={"order": order["id"], "slack": sid, "name": item["name"], "price": float(item["price"])}, timeout=5)
        except requests.RequestException:
            pass
    return jsonify({"ok": True})


@app.route("/api/orders")
@login
def orders():
    con = conn()
    cur = con.cursor()
    cur.execute("SELECT id, product_name AS name, price_hours AS price, created_at AS created FROM orders WHERE slack_id = %s ORDER BY created_at DESC", (session["slack"],))
    vals = cur.fetchall()
    done(cur)
    db.putconn(con)
    return jsonify([{"id": val["id"], "name": val["name"], "price": float(val["price"]), "created": val["created"].isoformat()} for val in vals])


@app.route("/api/admin", methods=["GET", "POST"])
@admin
def panel():
    con = conn()
    cur = con.cursor()
    if request.method == "POST":
        val = request.json or {}
        cur.execute("INSERT INTO products (name, description, price_hours, stock, image_url) VALUES (%s, %s, %s, %s, %s)", (val.get("name", "").strip(), val.get("descr", "").strip(), float(val.get("price", 0)), int(val.get("stock", -1)), val.get("image", "").strip() or None))
        con.commit()
        done(cur)
        db.putconn(con)
        return jsonify({"ok": True})
    cur.execute("SELECT id, name, description AS descr, price_hours AS price, stock, image_url AS image, is_active AS active FROM products ORDER BY created_at DESC")
    vals = cur.fetchall()
    done(cur)
    db.putconn(con)
    return jsonify([data(val) for val in vals])


@app.route("/api/admin/users")
@admin
def admin_users():
    con = conn()
    cur = con.cursor()
    cur.execute("SELECT slack_id, name, email, hours, is_admin AS admin FROM users ORDER BY name ASC NULLS LAST, slack_id ASC")
    vals = cur.fetchall()
    done(cur)
    db.putconn(con)
    return jsonify([
        {
            "slack_id": val["slack_id"],
            "name": val["name"],
            "email": val["email"],
            "hours": float(val["hours"]),
            "admin": bool(val["admin"]),
        }
        for val in vals
    ])


@app.route("/api/admin/users/<string:slack_id>/hours", methods=["POST"])
@admin
def admin_adjust_hours(slack_id):
    payload = request.get_json(silent=True) or {}
    try:
        delta = float(payload.get("delta_hours", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid hours delta"}), 400

    if delta == 0:
        return jsonify({"error": "hours delta must not be zero"}), 400

    reason = (payload.get("reason") or "admin adjustment").strip() or "admin adjustment"
    adjusted_by = session.get("slack")

    con = conn()
    cur = con.cursor()
    try:
        cur.execute("SELECT slack_id, hours FROM users WHERE slack_id = %s FOR UPDATE", (slack_id,))
        user = cur.fetchone()
        if not user:
            con.rollback()
            return jsonify({"error": "user not found"}), 404

        new_hours = float(user["hours"]) + delta
        cur.execute("UPDATE users SET hours = %s, updated_at = NOW() WHERE slack_id = %s", (new_hours, slack_id))
        cur.execute("INSERT INTO hour_adjustments (slack_id, delta_hours, reason, adjusted_by_slack_id) VALUES (%s, %s, %s, %s)", (slack_id, delta, reason, adjusted_by))
        con.commit()
        return jsonify({"ok": True, "hours": new_hours})
    finally:
        done(cur)
        db.putconn(con)


if __name__ == "__main__":
    init()
    app.run(port=int(os.environ.get("PORT", 3000)))

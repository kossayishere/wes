import re
from functools import wraps
from flask import Blueprint, request, render_template, redirect, url_for, session, g
from werkzeug.security import generate_password_hash, check_password_hash
from app.db import get_db

bp = Blueprint("auth", __name__, url_prefix="/auth")

def verify_email(email):
    email_regex = '^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$'
    match = re.match(email_regex, email)
    return match

@bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

@bp.before_app_request
def load_logged_in_user():
    user_id = session.get("user_id")
    if user_id is None:
        g.user = None
    else:
        g.user = get_db().execute(
            "SELECT * FROM user WHERE u_id = ?", (user_id, )
        ).fetchone()


@bp.route("/login", methods=("GET", "POST"))
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        db = get_db()
        error = None
        user = None

        if not email or not password:
            error = "All Informations are required"
        elif not verify_email(email):
            error = "Email is not Valid"
        else:
            user = db.execute(
                "SELECT * FROM user WHERE email = ?", (email, )
            ).fetchone()

        if user is None:
            error = "Incorrect Email or Password"
        elif not check_password_hash(user["password"], password):
            error = "Incorrect Email or Password"

        if error is None:
            session.clear()
            session["user_id"] = user["u_id"]
            return {"status": "ok", "msg": "correct login"}
        else:
            return {"status": "error", "msg": error}

    if request.method == "GET":
        if g.user:
            return redirect(url_for("index"))
        else:
            return render_template("auth/login.html")
        
@bp.route("/register", methods=("GET", "POST"))
def register():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        db = get_db()
        error = None

        ref = request.cookies.get('ref')
        if not ref:
            ref = 0

        if not email or not password:
            error = "All Informations are required"
        if not verify_email(email):
            error = "Email is not Valid"

        if error is None:
            try:
                cursor = db.cursor()
                cursor.execute(
                    "INSERT INTO user (email, password, ref) VALUES (?, ?, ?)",
                    (email, generate_password_hash(password), ref)
                )
                db.commit()
                session["user_id"] = cursor.lastrowid

            except db.IntegrityError:
                return {"status": "error", "msg": f"User {email} is already registred"}
            except db.Error:
                return {"status": "error", "msg": f"database inside error"}
            else:
                return {"status": "ok", "msg": "user have been registred"}
        else:
            return {"status": "error", "msg": error}

    if request.method == "GET":
        if g.user:
            return redirect(url_for("index"))
        else:
            return render_template("auth/register.html")


def login_required(f):
    @wraps(f)
    def wrapper(**kwargs):
        if g.user is None:
            return redirect(url_for("auth.login"))
        return f(**kwargs)
    return wrapper

    # blueprint
    # cookies
    # date
    # get_data
    # get_json
    # headers
    # is_secure
    # json
    # remote_addr
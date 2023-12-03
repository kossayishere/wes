from flask import Blueprint, request, render_template, redirect, url_for, session, g
from app.db import get_db

bp = Blueprint("profile", __name__, url_prefix="/profile")

@bp.route("/investments", methods=("GET",))
def investments():
    db = get_db()
    investments = db.execute(
        "SELECT * FROM investments WHERE u_id = ? ORDER BY i_id DESC", (g.user["u_id"], )
    ).fetchall()

    return render_template("profile/investments.html", investments=investments)

@bp.route("/invest", methods=("GET",))
def invest():
    return render_template("profile/invest.html")

@bp.route("/deposit", methods=("GET", "POST"))
def deposit():
    return render_template("profile/deposit.html")

@bp.route("/withdraw", methods=("GET", "POST"))
def withdraw():
    return render_template("profile/withdraw.html")

@bp.route("/transactions", methods=("GET",))
def transactions():
    db = get_db()
    deposits = db.execute(
        "SELECT * FROM deposits WHERE u_id = ? ORDER BY d_id DESC", (g.user["u_id"], )
    ).fetchall()

    withdraws = db.execute(
        "SELECT * FROM withdraws WHERE u_id = ? ORDER BY w_id DESC", (g.user["u_id"], )
    ).fetchall()

    return render_template("profile/transactions.html", deposits=deposits, withdraws=withdraws)

@bp.route("/referral_system", methods=("GET",))
def referral_system():
    refs = get_db().execute(
        "SELECT * FROM user WHERE ref = ? Order by time DESC", (g.user["u_id"], )
    ).fetchall()

    return render_template("profile/referral-system.html", refs=refs)

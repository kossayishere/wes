from flask import Blueprint, request, render_template, redirect, url_for, session, g
from app.db import get_db

bp = Blueprint("p", __name__, url_prefix="")

coins_list = [  "BTC","ETH","LTC","TRX","BCH","DOGE","XMR","XLM",
                "XTZ","EOS","ETC","XRP","ADA", "DASH","ZEC", "SOL",
                "BNB", "SHIB", "LINK", "USDC", "QTUM", "ONT", "BAT",
                "CELR", "MATIC", "ANKR", "MTL", "TOMO", "KEY", "DOCK", 
                "CHZ", "XTZ", "RVN"]

@bp.route('/trading', defaults={'p': None})
@bp.route("/trading/<p>", methods=("GET",))
def trading(p):
    error = None
    db = get_db()
    if not p:
        pair = "BTC_USDT".split("_")
    else:
        pair = p.split("_")
        if pair[0] not in coins_list:
            pair = "BTC_USDT".split("_")
    
    coin_name = pair[0]

    if pair[0] == "USDC":
        pair[0] = "USDCTRC20"
    if pair[0] == "BNB":
        pair[0] = "BNBBEP20"
    if pair[0] == "SHIB":
        pair[0] = "SHIBBEP20"
    if pair[0] == "LINK":
        pair[0] = "LINKERC20"

    if pair[1] == "USDT":
        usdt_list = ["USDTERC20", "USDTTRC20", "USDTBEP20"]

    _sum_usdt = 0
    for p in usdt_list:
        a = db.execute(
            "SELECT balance FROM balances WHERE u_id = ? AND coin = ?", (g.user["u_id"], p)
        ).fetchone()
        if a:
            print(a["balance"])
            _sum_usdt += a["balance"]

    _sum_coin = 0
    b = db.execute(
        "SELECT balance FROM balances WHERE u_id = ? AND coin = ?", (g.user["u_id"], pair[0])
    ).fetchone()
    if b:
        print(b["balance"])
        _sum_coin += b["balance"]

    t = db.execute(
        "SELECT * FROM trades WHERE u_id = ? ORDER BY t_id DESC", (g.user["u_id"],)
    ).fetchall()
    if t:
        for i in t:
            print(i['coin'])
            print(i['amount'])
            print(i['type'])
    else:
        t = None 
    
    g.trading = {
        "_sum_usdt": _sum_usdt,
        "_sum_coin": _sum_coin,
        "coin"     : pair[0]
    }

    return render_template(
        "trading.html", 
        sum_usdt=_sum_usdt, 
        sum_coin=_sum_coin, 
        coin=pair[0], 
        coin_name=coin_name,
        table=t
    )
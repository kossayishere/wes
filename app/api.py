import os, json, requests, datetime
from flask import Blueprint, request, render_template, send_file, session, g
from app.db import get_db
import qrcode
from binance.spot import Spot

bp = Blueprint("api", __name__, url_prefix="/api")

coins = [
    'BTCUSDT', 'ETHUSDT', 'LTCUSDT', 'USDCUSDT', 'BCHUSDT','DOGEUSDT',
    'XLMUSDT', 'XTZUSDT', 'EOSUSDT', 'SHIBUSDT', 'LINKUSDT', 'ETCUSDT', 'XRPUSDT',
    'ADAUSDT', 'DASHUSDT', 'ZECUSDT', 'SOLUSDT'
]

client = Spot()

def serialize_datetime(obj): 
    if isinstance(obj, datetime.datetime): 
        return obj.isoformat() 
    raise TypeError("Type not serializable") 

@bp.route("/get_withdraws", methods=("POST",))
def get_withdraws():
    withdraws = get_db().execute(
        "SELECT * FROM withdraws WHERE u_id = ? ORDER BY w_id DESC", (g.user["u_id"], )
    ).fetchall()

    if withdraws:
        results = [tuple(row) for row in withdraws]
        return {"status": "ok", "data": json.dumps(results, default=serialize_datetime)}
    else:
        return {"status": "error", "msg": "no Transactions"}

@bp.route("/update_deposits", methods=("POST",))
def update_deposits():
    error = True
    db = get_db()
    deposits = db.execute(
        "SELECT * FROM deposits WHERE u_id = ? ORDER BY d_id DESC", (g.user["u_id"], )
    ).fetchall()

    if deposits:
        for dep in deposits:
            if dep and not dep["added"]:
                error = False
                r = requests.request(
                    "GET",
                    f'https://api.nowpayments.io/v1/payment/{dep["payment_id"]}', 
                    headers={'x-api-key': '1QK2E69-Z7SMKVM-QV7A9HP-GA7DZXY'}, 
                    data={}
                )
                if r:
                    r = r.json()
                    if r["payment_status"] != dep["payment_status"]:
                        db.execute(
                            f"""UPDATE deposits SET payment_status = '{r["payment_status"]}' 
                            WHERE payment_id = ? AND u_id = ?
                            """, 
                            (dep["payment_id"], g.user["u_id"])
                        )
                        db.commit()

                    if r["payment_status"] in ["confirmed", "finished", "sending"]:
                        balance = db.execute(
                            "SELECT * FROM balances WHERE u_id = ? AND coin = ?",
                            (g.user["u_id"], dep["pay_currency"])
                        ).fetchone()

                        if balance:
                            db.execute(
                                f"""UPDATE balances SET balance = balance + {r['pay_amount']} 
                                WHERE coin = ? AND u_id = ?""", 
                                (dep["pay_currency"], g.user["u_id"])
                            )
                            db.commit()
                        else:
                            try:
                                db.execute(
                                    "INSERT INTO balances (coin, balance, u_id) VALUES (?, ?, ?)",
                                    (dep["pay_currency"], r["pay_amount"], g.user["u_id"])
                                )
                                db.commit()
                            except db.IntegrityError:
                                print("IntegrityError")
                            except db.Error:
                                print("database inside error")

                        db.execute(
                            "UPDATE deposits SET added = true WHERE payment_id = ? AND u_id = ?", 
                            (dep["payment_id"], g.user["u_id"])
                        )
                        db.commit()

                        ref_balance = db.execute(
                            "SELECT * FROM balances WHERE u_id = ? AND coin = ?",
                            (g.user["ref"], dep["pay_currency"])
                        ).fetchone()

                        if ref_balance:
                            db.execute(
                                f"""UPDATE balances SET balance = balance + { r['pay_amount'] / 2 } 
                                WHERE coin = ? AND u_id = ?""", 
                                (dep["pay_currency"], g.user["ref"])
                            )
                            db.commit()
                        else:
                            try:
                                db.execute(
                                    "INSERT INTO balances (coin, balance, u_id) VALUES (?, ?, ?)",
                                    (dep["pay_currency"], r["pay_amount"] / 2, g.user["ref"])
                                )
                                db.commit()
                            except db.IntegrityError:
                                print("IntegrityError")
                            except db.Error:
                                print("database inside error")

                        db.execute(
                            f"UPDATE user SET commission = commission + { r['pay_amount'] / 2 } WHERE u_id = ?",
                            (g.user["u_id"], )
                        )
                        db.commit()

    if error == False:
        select_all = db.execute(
            "SELECT * FROM deposits WHERE u_id = ? ORDER BY d_id DESC", (g.user["u_id"], )
        ).fetchall()
        if select_all:
            results = [tuple(row) for row in select_all]
            return {"status": "ok", "data": json.dumps(results)}
        else:
            return {"status": "error", "msg": "no Transactions"}
    else:
        return {"status": "error", "msg": "no Updates"}

@bp.route("/get_minimum_deposit/<coin>", methods=("GET",))
def get_minimum_deposit(coin):
    if not coin:
        return {"status": "error", "msg": "no Currency found"} 
    else:
        response = requests.request(
            "GET", 
            f"https://api.nowpayments.io/v1/min-amount?currency_from={coin}&currency_to={coin}&fiat_equivalent=usd&is_fee_paid_by_user=False", 
            headers = { 'x-api-key': '1QK2E69-Z7SMKVM-QV7A9HP-GA7DZXY' }, 
            data = {}
        )
        min_response = response.json()
        if min_response:
            if "min_amount" in min_response:
                return {
                    "status": "ok", 
                    "min_amount": min_response["min_amount"],
                    "usd_equivalent": min_response["fiat_equivalent"],
                }
            return {
                "status": "error", 
                "msg": "false call"
            }
        return {
            "status": "error", 
            "msg": "call problem"
        }

@bp.route("/deposit_request", methods=("POST",))
def save_deposit():
    error = None
    db = get_db()
    price_amount =      request.form["price_amount"]
    pay_currency =      request.form["pay_currency"]

    if not price_amount or not pay_currency:
        error = "no Amount or Currency"
    else:
        response = requests.request(
            "POST", 
            "https://api.nowpayments.io/v1/payment", 
            headers = {
                'x-api-key': '1QK2E69-Z7SMKVM-QV7A9HP-GA7DZXY',
                'Content-Type': 'application/json'
            }, 
            data = json.dumps({
                "price_amount": price_amount,
                "price_currency": "usd",
                "pay_currency": pay_currency
            })
        )
        dep_response = response.json()

        if dep_response:

            if (not dep_response["payment_id"] or not dep_response["payment_status"] 
                or not dep_response["pay_address"] or not dep_response["price_amount"] 
                or not dep_response["price_currency"] or not dep_response["pay_amount"] 
                or not dep_response["pay_currency"] or not dep_response["network"] 
                or not dep_response["valid_until"] or not dep_response["created_at"]):
                error = "Internal error"

            if error is None:
                try:
                    db.execute(
                        """INSERT INTO deposits 
                        (payment_id, payment_status, pay_address , price_amount
                        , price_currency, pay_amount, pay_currency, network, 
                        valid_until, created_at, u_id) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) """,
                        (dep_response["payment_id"], dep_response["payment_status"], 
                        dep_response["pay_address"] , dep_response["price_amount"], 
                        dep_response["price_currency"], dep_response["pay_amount"], 
                        dep_response["pay_currency"], dep_response["network"], 
                        dep_response["valid_until"], dep_response["created_at"], 
                        g.user["u_id"])
                    )
                    db.commit()
                except db.IntegrityError:
                    return {"status": "error", "msg": f"you cant save {dep_response['payment_id']}"}
                except db.Error:
                    return {"status": "error", "msg": "database inside error"}
                else:
                    img = qrcode.make(dep_response["pay_address"])
                    image_name = f"{os.getcwd()}/app/static/qr/qr_{dep_response['pay_address']}.png"
                    img.save(image_name)

                    return {
                        "status": "ok", 
                        "payment_id": dep_response["payment_id"],
                        "pay_address": dep_response["pay_address"], 
                        "pay_amount": dep_response["pay_amount"],
                    }
            else:
                return {"status": "error", "msg": error}
        else:
            return {"status": "error", "msg": "payment service problem"}

@bp.route("/withdraw_request", methods=("POST",))
def withdraw_request():
    error = None
    db = get_db()
    coin_amount =      request.form["coin_amount"]
    pay_currency =     request.form["pay_currency"]
    withdraw_address = request.form["withdraw_address"]

    if not coin_amount or not pay_currency or not withdraw_address:
        return {"status": "error", "msg": "no Amount or Currency or Address"}
    else:
        balance = db.execute(
            "SELECT * FROM balances WHERE coin = ? AND u_id = ?", (pay_currency, g.user["u_id"])
        ).fetchone()
        if balance:
            coin_amount = float(coin_amount)
            if coin_amount < 150:
                return { "status": "limit", "msg": "the encouragement" }

            elif balance["balance"] >= coin_amount:
                db.execute(
                    f"UPDATE balances SET balance = balance - {coin_amount} WHERE coin = ? AND u_id = ?", 
                    (pay_currency, g.user["u_id"])
                )
                db.commit()
                try:
                    db.execute(
                        """INSERT INTO withdraws (w_amount, w_address, w_coin, has_ref, u_id) 
                        VALUES (?, ?, ?, ?, ?) """,
                        (coin_amount, withdraw_address, pay_currency, g.user["has_ref"], g.user["u_id"])
                    )
                    db.commit()
                except db.IntegrityError:
                    return {"status": "error", "msg": f"withdraw not possible now {w_address}"}
                except db.Error:
                    return {"status": "error", "msg": "database inside error"}
                else:
                    return { "status": "ok", "msg": "your request will be processed as soon as possible." }
            else:
                return { "status": "error", "msg": "You balance is not enought." }
        else:
            return { "status": "error", "msg": "You have No balance for this Coin." }

@bp.route("/generate_qr/<address>", methods=("GET",))
def generate_qr(address):
    error_qr = f"{os.getcwd()}/app/static/qr/error_qr.png"
    qr = f"{os.getcwd()}/app/static/qr/qr_{address}.png"
    if os.path.exists(qr):
        return send_file(qr, mimetype='image/png')
    return send_file(error_qr, mimetype='image/png')

@bp.route("/24hr", methods=("GET",))
def _24hr():
    data = client.ticker_24hr(symbols=coins)
    if data:
        return { "status": "ok", "data": data }
    return { "status": "error", "data": {} }

@bp.route("/chart-info/<c>", methods=("GET",))
def chart_info(c):
    if request.method == "GET":
        coin = c.upper() + "USDT"
        data = []
        status = "error"
        if coin in coins:
            rows = client.klines(coin, "1m", limit=1000)
            data = []
            d = {}
            for row in rows:
                data.append({
                    "time": row[0],
                    "open": float(row[1]),
                    "high": float(row[2]),
                    "low": float(row[3]),
                    "close": float(row[4]),
                    "volume": float(row[5])
                })
            status = "ok"

        return {
            "status": status,
            "data": data
        }

@bp.route("/save_buy", methods=("POST",))
def save_buy():
    error = None
    db = get_db()
    buy_amount =    request.form["buy_amount"]
    coin_to_buy =   request.form["coin_to_buy"]
    coin_value =    request.form["coin_value"]

    if not buy_amount or not coin_to_buy or not coin_value:
        return {"status": "error", "msg": "not enough Infos."}
    else:
        buy_amount = float(buy_amount)
        coin_value = float(coin_value)
        usdt_balance = 0
        b = db.execute(
            """SELECT * FROM balances 
            WHERE coin IN ('USDTTRC20', 'USDTERC20', 'USDTBEP20') AND u_id = ?""",
            (g.user["u_id"], )
        ).fetchall()
        if len(b) > 0:
            print(len(b))
            usdt_coins_with_balance = []
            for p in b:
                usdt_coins_with_balance.append({ "coin" : p["coin"], "balance" : p["balance"] })
                usdt_balance += p["balance"]

            if usdt_balance >= buy_amount:
                org_buy_amount = buy_amount

                for t in usdt_coins_with_balance:
                    if buy_amount > 0:
                        if buy_amount >= t["balance"]:
                            db.execute(
                                f"UPDATE balances SET balance = 0 WHERE coin = ? AND u_id = ?", 
                                (t["coin"], g.user["u_id"])
                            )
                            db.commit()
                        else:
                            db.execute(
                                f"UPDATE balances SET balance = balance - {buy_amount} WHERE coin = ? AND u_id = ?", 
                                (t["coin"], g.user["u_id"])
                            )
                            db.commit()
                        buy_amount = buy_amount - t["balance"]

                try:
                    db.execute(
                        "INSERT INTO trades (coin, amount, type, u_id) VALUES (?, ?, ?, ?)",
                        (coin_to_buy, round(org_buy_amount / coin_value, 8), 0, g.user["u_id"])
                    )
                    db.commit()
                except db.IntegrityError:
                    return {"status": "error", "msg": f"withdraw not possible now {w_address}"}
                except db.Error:
                    return {"status": "error", "msg": "database inside error"}
                else:
                    return { "status": "ok", "msg": "your request will be processed as soon as possible." }
            else:
                return { "status": "error", "msg": "You balance is not enought." }
        else:
            return { "status": "error", "msg": "there is no USDT fund."}

@bp.route("/save_sell", methods=("POST",))
def save_sell():
    error = None
    db = get_db()
    sell_amount =   request.form["sell_amount"]
    the_coin =      request.form["the_coin"]
    coin_value =    request.form["coin_value"]

    if not sell_amount or not the_coin or not coin_value:
        return {"status": "error", "msg": "not enough Infos."}
    else:
        sell_amount = float(sell_amount)
        the_coin = the_coin.upper()
        coin_value = float(coin_value)
        in_usdt = round(sell_amount * coin_value, 8)

        b = db.execute(
            "SELECT balance FROM balances WHERE coin = ? AND u_id = ?",
            (the_coin, g.user["u_id"], )
        ).fetchone()
        if b:
            if b["balance"] >= sell_amount:
                new_coin_balance = round(b["balance"] - sell_amount, 8)
                db.execute(
                    f"UPDATE balances SET balance = {new_coin_balance} WHERE coin = ? AND u_id = ?", 
                    (the_coin, g.user["u_id"])
                )
                db.commit()

                try:
                    db.execute(
                        "INSERT INTO trades (coin, amount, type, u_id) VALUES (?, ?, ?, ?)",
                        (the_coin, round(sell_amount * coin_value, 8), 1, g.user["u_id"])
                    )
                    db.commit()
                    print("INSERT INTO trades ")
                except db.IntegrityError:
                    return { "status": "error", "msg": "trade not possible now" }
                except db.Error:
                    return { "status": "error", "msg": "database inside error" }

                u = db.execute(
                    "SELECT balance FROM balances WHERE coin = 'USDTTRC20' AND u_id = ?",
                    (g.user["u_id"], )
                ).fetchone()
                if u:
                    new_usdt_balance = round(u["balance"] + in_usdt, 8)
                    db.execute(
                        f"UPDATE balances SET balance = {new_usdt_balance} WHERE coin = 'USDTTRC20' AND u_id = ?", 
                        (g.user["u_id"],)
                    )
                    db.commit()
                    print("UPDATE USDTTRC20")
                    return { "status": "ok", "msg": "your trade have been executed." }
                try:
                    db.execute(
                        "INSERT INTO balances (coin, balance, u_id) VALUES (?, ?, ?)",
                        ('USDTTRC20', in_usdt, g.user['u_id'])
                    )
                    db.commit()
                    print("INSERT INTO USDTTRC20")
                except db.IntegrityError:
                    return { "status": "error", "msg": "trade not possible now" }
                except db.Error:
                    print(db.Error)
                    return { "status": "error", "msg": "database inside error" }
                else:
                    return { "status": "ok", "msg": "your trade have been executed." }
            
            return { "status": "error", "msg": "You balance is not enought." }
        
        return { "status": "error", "msg": "there is no Coin fund."}

@bp.route("/invest", methods=("POST",))
def invest():
    error = None
    db = get_db()
    coin_amount =    request.form["coin_amount"]
    usd_amount =     request.form["usd_amount"]
    coin_value =     request.form["coin_value"]
    coin =           request.form["coin"]
    plan =           request.form["plan"]

    if not coin_amount or not usd_amount or not coin_value or not coin or not plan:
        return { "status": "error", "msg": "you cant save this investment"}
    else:
        b = db.execute(
            "SELECT balance FROM balances WHERE coin = ? AND u_id = ?",
            (coin, g.user["u_id"])
        ).fetchone()
        if b:
            if b["balance"] >= coin_amount:
                new_coin_balance = round(b["balance"] - coin_amount, 8)
                db.execute(
                    f"UPDATE balances SET balance = {new_coin_balance} WHERE coin = ? AND u_id = ?", 
                    (coin, g.user["u_id"])
                )
                db.commit()

                try:
                    db.execute(
                        """INSERT INTO investments 
                        (coin, coin_amount, usd_amount, plan, u_id) 
                        VALUES (?, ?, ?, ?, ?) """,
                        (coin, coin_amount, usd_amount, plan, g.user["u_id"])
                    )
                    db.commit()
                except db.IntegrityError:
                    return {"status": "error", "msg": "you cant save this investment"}
                except db.Error:
                    return {"status": "error", "msg": "database inside error"}
                else:
                    return { "status": "ok" }
                
        return {"status": "error", "msg": "Not enough in this Coin's Balance."}
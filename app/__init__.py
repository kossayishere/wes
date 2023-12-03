from flask import Flask, render_template, g, request, session, make_response
from binance.spot import Spot

app = Flask(__name__)

app.config.from_mapping(
    SECRET_KEY="kosai secret key",
    DATABASE="database.db",
    SESSION_COOKIE_SAMESITE='Lax'
)

app.config.from_mapping()

from . import db
from . import auth
from . import api
from . import profile
from . import platform

db.init_app(app)
app.register_blueprint(auth.bp)
app.register_blueprint(api.bp)
app.register_blueprint(profile.bp)
app.register_blueprint(platform.bp)

coins_names = {
    "BTC" : 'Bitcoin', "ETH" : 'Ethereum', 
    "LTC" : 'Litecoin', "USDC" : 'USD Coin',
    "BCH" : 'Bitcoin Cash',"DOGE" : 'Dogecoin',
    "XLM" : 'Stellar', "XTZ" : 'Tezos',
    "EOS" : 'EOS', "SHIB" : 'SHIBA INU',
    "LINK" : 'Chainlink', "ETC" : 'Ethereum Classic', 
    "XRP" : 'Ripple', "ADA" : 'Cardano', 
    "DASH" : 'Dash', "ZEC" : 'Zcash', 
    "SOL" : 'Solana'
}

coins_list = [
    'BTCUSDT', 'ETHUSDT', 'LTCUSDT', 'USDCUSDT', 'BCHUSDT','DOGEUSDT',
    'XLMUSDT', 'XTZUSDT', 'EOSUSDT', 'SHIBUSDT', 'LINKUSDT', 'ETCUSDT', 'XRPUSDT',
    'ADAUSDT', 'DASHUSDT', 'ZECUSDT', 'SOLUSDT'
]

def get_balances_value():
    voids = {
        "BTC": ["Bitcoin", 0], "ETH" : ["Ethereum", 0], 
        "LTC": ["Litecoin", 0] , "TRX": ["Tron", 0], 
        "USDTTRC20": ["Tether", 0], "USDTERC20": ["Tether", 0], 
        "USDTBEP20": ["Tether", 0], "BCH": ["Bitcoin Cash", 0], 
        "USDC": ["USD Coin", 0], "DOGE": ["Dogecoin", 0], 
        "XMR": ["Monero", 0], "DASH": ["Dash", 0], 
        "XRP": ["Ripple", 0], "ETC": ["Ethereum Classic", 0]
    }
    obj = {}
    coins = g.db.execute("""SELECT coin, balance FROM balances WHERE u_id = ? AND 
    (coin = 'BTC' OR coin = 'ETH' OR coin = 'LTC' OR coin = 'TRX' OR coin = 'USDCTRC20' OR 
    coin = 'BCH' OR coin = 'DOGE' OR coin = 'XMR' OR coin = 'ETC' OR coin = 'XRP' OR 
    coin = 'DASH' OR coin = 'USDTTRC20' OR coin = 'USDTERC20' OR coin = 'USDTBEP20')""", (g.user["u_id"],)).fetchall()
    if coins:
        for c in coins:
            for v in voids.keys():
                if c[0] == v:
                    voids[v][1] = c[1]
    usdt_sum = 0
    ex = []
    for x in voids.keys():
        if x in ['USDTTRC20', 'USDTERC20', 'USDTBEP20']:
            usdt_sum += voids[x][1]
            ex.append(x)
    voids["USDT"] = ["Teather", usdt_sum]
    for x in ex:
        voids.pop(x)

    return voids

@app.route("/")
@app.route("/<int:ref>")
def index(ref=0):
    all_coins = []
    if g.user:
        coins = get_balances_value()
        return render_template("wallet.html", coins=coins)
    else:
        data = Spot().ticker_24hr(symbols=coins_list)
        resp = make_response(
            render_template(
                "index.html", 
                data=data, 
                coins_names=coins_names,
                part_of_data=data[0:5]
            )
        )
        if ref:
            resp.set_cookie('ref', str(ref))
        return resp

@app.route("/market-screener")
def market_screener():
    return render_template("market-screener.html")

@app.route("/tech-anal")
def tech_anal():
    return render_template("technical-analysis.html")

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

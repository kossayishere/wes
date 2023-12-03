import { form_maker , coin_and_currency } from "./tools.js"

async function show_currencies(coin) {
    const table = document.getElementById('values_table');
    let coin_value = 0;
    await fetch("/api/24hr", {
        method: "GET", 
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Accept': 'application/json',
        }
    })
    .then(async res => {
        let resBody = await res.json()

        if (res.status == 200) {
            for (let i in resBody["data"]) {
                const c = resBody["data"][i];
                let symbol = c["symbol"].replace("USDT", "");
                let low_symbol = symbol.toLowerCase();
                let askPrice = parseFloat(c["askPrice"], 10)

                let percent_color = "#03a66d"
                if (c["priceChangePercent"] < 0) {
                    percent_color = "#f6465d"
                }

                table.innerHTML += `
                    <a class="coin" href="/trading/${symbol}_USDT">
                        <div class="currency">
                            <img src="../static/images/coins/${low_symbol}.svg" width="20px">
                            <span class="coin_name">
                                <span class="coin_n">${symbol}</span><span class="usdt_n">/USDT</span>
                            </span>
                        </div>
                        <div class="last">
                            <span class="coin_value" id="t_c_coin_value_${low_symbol}">
                                ${askPrice}
                            </span>
                        </div>
                        <div class="change">
                            <span class="coin_change" style="color:${percent_color};">${c["priceChangePercent"]}</span>
                        </div>
                    </a>
                `
                if (low_symbol == coin) {
                    coin_value = askPrice
                }
            }
        } else {
            console.log(resBody)
        }
    })
    .catch(error => {
        console.log(error)
    });

    return coin_value
}

function generate_values(coin_value) {
    const d = new Date();
    let date = d.getDate() + "." + d.getMonth() + " " + d.getHours() + ":" + d.getMinutes();
    let min = 1 / coin_value;
    let max = min * 30000;
    let fix = 6;
    if (parseInt(coin_value) < 0) fix = 2;
    else if (parseInt(coin_value) < 100) fix = 4;

    return [date, min, max, fix]
}

function show_trades(coin, coin_value) {
    const trades_table = document.getElementById('inner_trades');
    const trades_head = document.getElementById('trades_head');

    const _COIN = coin.toUpperCase()

    let [date, min, max, fix] = generate_values(coin_value)

    trades_head.innerHTML += `
        <div class="price">Price(USDT)</div>
        <div class="size">Size(${_COIN})</div>
        <div class="time">Time</div>
    `
    
    for (let i = 0; i < 30; i++) {
        let quantity = (Math.random() * (max - min) + min).toFixed(fix);
        let value_color = "#03a66d"
        if (Math.random() < 0.40)
            value_color = "#f6465d"
        
        trades_table.innerHTML += `
            <div class="coin">
                <div class="coin_value">
                    <span class="value" style="color:${value_color}">${coin_value}</span> 
                </div>
                <div class="coin_quantity">
                    <span class="quantity">${quantity}</span>
                </div>
                <div class="coin_time">
                    <span class="date">${date}</span>
                </div>
            </div>
        `
    }
}
let wi = (document.body.offsetWidth - 350)
let he = 600
if (document.body.offsetWidth < 750) {
    wi = document.body.offsetWidth
    he = 400
}

const chartPropeties = {
    width: wi,
    height: he,
    layout: {
        background: { type: 'solid', color: '#17181e', },
        textColor: 'rgba(255, 255, 255, 0.9)',
    },
    grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.5)', },
        horzLines: { color: 'rgba(197, 203, 206, 0.5)', },
    },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal, },
    rightPriceScale: {
        scaleMargins: {
            top: 0.1,
            bottom: 0.2,
        },
        borderColor: 'rgba(197, 203, 206, 0.2)', 
    },
    timeScale: { 
        borderColor: 'rgba(197, 203, 206, 0.2)', 
    },
    timeScale: {
        timeVisible: true,
        secondVisible: true
    },
    localization: {
        priceFormatter: price => {
            if (price > 100) {
                return parseFloat(price).toFixed(2);
            }
            if (price > 1 && price < 100) {
                return parseFloat(price).toFixed(4);
            }
            if (price <= 1 && price > 0.001) {
                return parseFloat(price).toFixed(5);
            }
            if (price < 0.001) {
                return parseFloat(price).toFixed(8);
            }
        }
    }
}

let chart = LightweightCharts.createChart(document.getElementById('inner_chart'), chartPropeties);

let coin = "btc";
let url = (document.location.pathname).split('/')
if (url.length >= 3) {
    let s = url[2].split('_')
    if (s.length >= 2 ) {
        coin = s[0].toLowerCase()
    }
}

async function _load_chart(chart, coin) {

    let chart_data = document.getElementById('chart_data');
    let c_data = {};

    let symbol = coin.toUpperCase() + "USDT";

    let coin_value;
    show_currencies(coin, coin_value).then((res) => {
        coin_value = res;
        show_trades(coin, res)
    })

    // put data in HTML
    await fetch(
        `/api/chart-info/${coin}`, 
        { 
            method: "GET", 
            headers: { "Access-Control-Allow-Origin": "*", } 
        }
    ) .then(async res => {
        let resBody = await res.json()
        if (res.status == 200) {
            if (resBody["status"] == "ok") {
                c_data = resBody["data"];
                chart_data.innerHTML += JSON.stringify(resBody["data"]);
            } else {
                console.log(resBody["status"])
            }
        } else {
            console.log(res.status)
        }
    })
    .catch(error => {
        console.log(error)
    });

    var candleSeries = chart.addCandlestickSeries({
        upColor: '#66BB66',
        downColor: '#EF5350',
    });

    chart.applyOptions({
        watermark: {
            color: '#1f2226',
            visible: true,
            text: "     ",
            fontSize: 50,
            fontWeight: 'bold',
            horzAlign: 'center',
            vertAlign: 'center',
        },
        layout: {
            textColor: '#515964',
            fontSize: 12,
            fontFamily: 'Roboto-Regular, sans-serif',
        },
        grid: {
            vertLines: {
                color: '#1d2127',
                style: 1,
                visible: true,
            },
            horzLines: {
                color: '#1d2127',
                style: 1,
                visible: true,
            },
        },
        localization: {
            locale: 'en-US',
        },
        crosshair: {
            vertLine: {
                color: '#767f8b',
                width: 0.2,
                style: 1,
                visible: true,
                labelVisible: true,
            },
            horzLine: {
                color: '#767f8b',
                width: 0.5,
                style: 0,
                visible: true,
                labelVisible: true,
            },
            mode: 3
        }
    });

    var volumeSeries = chart.addHistogramSeries({
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: 'xvolume',
    });

    chart.priceScale('xvolume').applyOptions({
        scaleMargins: {
            top: 0.8,
            bottom: 0.01,
        },
    });

    function get_time(unix) {
        let dx = new Date(unix)
        let xdate = `${dx.getFullYear()}-${dx.getMonth()}-${dx.getDate()} ${dx.getHours()}:${dx.getMinutes()}`
        return Date.parse(xdate)/1000
    }

    var candleData = c_data.map(d => ({
            time: get_time(d["time"]),
            open: d["open"],
            close: d["close"],
            high: d["high"],
            low: d["low"],
    }));
    candleSeries.setData(candleData);

    var areaSeries = chart.addAreaSeries({
        lastValueVisible: false, // hide the last value marker for this series
        crosshairMarkerVisible: false, // hide the crosshair marker for this series
        lineColor: 'transparent', // hide the line
        topColor: 'rgba(56, 33, 110,0.3)',
        bottomColor: 'rgba(56, 33, 110, 0.05)',
    });

    var lineData = c_data.map(d => ({
            time: get_time(d["time"]),
            value: (d["close"] + d["open"]) / 2,
    }));
    areaSeries.setData(lineData);

    const volumeData = c_data.map(d => {
        let clr = '#501f1e';
        if (d['open'] < d['close']) {
            clr = '#0f3a36'; //green
        }
        return { 
            time: get_time(d["time"]), 
            value: d['volume'], 
            color: clr 
        }
    })
    volumeSeries.setData(volumeData);

    // SOCKET

    let socket = new WebSocket(`wss://stream.binance.com:9443/ws/${coin}usdt@kline_1m`);

    let t_c_coin_value;
    let trades_table;

    socket.onopen = function(e) { 
        console.log("[open]"); 
        t_c_coin_value = document.getElementById(`t_c_coin_value_${coin}`);
        trades_table = document.getElementById('inner_trades');
    };

    socket.onmessage = function(event) { 
        let d = JSON.parse(event.data)
        let _time = d.k.t; let _e_time = d.k.T; 
        let _open = parseFloat(d.k.o);
        let _close = parseFloat(d.k.c); 
        let _high = parseFloat(d.k.h); 
        let _low = parseFloat(d.k.l);
        let _volume = parseFloat(d.k.v);

        candleSeries.update({
            "time": get_time(_time),
            "open": _open,
            "close": _close,
            "high": _high,
            "low": _low
        })

        areaSeries.update({
            time: get_time(_time),
            value: ((_close + _open) / 2)
        })

        volumeSeries.update({
            time: get_time(_time), 
            value: _volume, 
            color: ((_open < _close) ? '#0f3a36' : '#501f1e')
        })

        t_c_coin_value.innerHTML = _close

        let coin_value = _close
        let [date, min, max, fix] = generate_values(coin_value)

        let limit = parseInt(Math.random() * 5);
        for (let i = 0; i < limit; i++) {
            let quantity = (Math.random() * (max - min) + min).toFixed(fix);
            let value_color = "#03a66d"
            if (Math.random() < 0.40)
                value_color = "#f6465d";
    
                trades_table.firstElementChild.insertAdjacentHTML("beforeBegin",
                `<div class="coin">
                    <div class="coin_value">
                        <span class="value" style="color:${value_color}">${coin_value}</span> 
                    </div>
                    <div class="coin_quantity">
                        <span class="quantity">${quantity}</span>
                    </div>
                    <div class="coin_time">
                        <span class="date">${date}</span>
                    </div>
                </div>`
            );

            (trades_table.lastChild).remove();

            console.log("ok")
        }
    };

    socket.onclose = function(event) {
        if (event.wasClean) { console.log(`[close] cleanly, code=${event.code} reason=${event.reason}`);} 
        else { console.log('[close]'); }
    };

    socket.onerror = function(error) { console.log(`[error]`); };

    return chart
}

window.addEventListener("load", () => {
    _load_chart(chart, coin);
});


window.addEventListener("resize", () => {
    let w = (document.body.offsetWidth - 350)
    let h = 600
    if (document.body.offsetWidth < 750) {
        w = document.body.offsetWidth
        h = 400
    }
    chart.applyOptions({
        width: w,
        height: h
    })
});

document.getElementById('buy_amount').addEventListener("keyup", () => {
    let amount = document.getElementById('buy_amount').value
    if (isNaN(amount) || !amount || amount == 0) {
        document.getElementById('get_of_coin').innerHTML = "0.000000"
    } else {
        let the_coin = document.getElementById('the_coin').innerText
        let coin_value = document.getElementById(`t_c_coin_value_${the_coin.toLowerCase()}`).innerText
        if (coin_value) {
            document.getElementById('get_of_coin').innerHTML = (parseFloat(amount) / coin_value).toFixed(8)
        } else {
            console.log("unvalid coin.");
        }
    }
    console.log(amount)
});

document.getElementById('buy_btn').addEventListener("click", async (event) => {
    event.preventDefault()
    let available_usdt = parseFloat(document.getElementById('available_of_usdt').innerText)
    let buy_amount = parseFloat(document.getElementById('buy_amount').value)
    let the_coin = document.getElementById('the_coin').innerText
    let coin_value = parseFloat(document.getElementById(`t_c_coin_value_${the_coin.toLowerCase()}`).innerText)
    
    if (!available_usdt || !coin_value) {
        console.log("not enought balance.")
    } else if (!buy_amount || (buy_amount <= 0)) {
        console.log("put a valid amount.")
    } else if (buy_amount > available_usdt) {
        console.log("not enough USDT in balance.")
    } else if (coin_value <= 0) {
        console.log("unvalid coin value.")
    } else {
        let trade_formBody = form_maker({
            "buy_amount":     buy_amount,
            "coin_to_buy":   the_coin,
            "coin_value":   coin_value,
        })

        await fetch("http://127.0.0.1:5000/api/save_buy", {
            method: "POST",
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: trade_formBody
        })
        .then(async res => {
            if (res.status == 200 || res.status == 201) {
                res.json().then( async resBody => {
                    if (resBody["status"] == "ok") {
                        console.log(resBody["status"])
                        console.log(resBody["msg"])
                    } else {
                        console.log(resBody["status"])
                        console.log(resBody["msg"])
                    }
                })
            } else {
                console.log(res.status + " error")
            }
        })
        .catch(error => { console.log(error) });
    }
})

document.getElementById('sell_amount').addEventListener("keyup", () => {
    let amount = document.getElementById('sell_amount').value
    if (isNaN(amount) || !amount || amount == 0) {
        document.getElementById('get_of_usdt').innerHTML = "0.000000"
    } else {
        let the_coin = document.getElementById('the_coin').innerText
        let coin_value = document.getElementById(`t_c_coin_value_${the_coin.toLowerCase()}`).innerText
        if (coin_value) {
            document.getElementById('get_of_usdt').innerHTML = (coin_value * parseFloat(amount)).toFixed(8)
        } else {
            console.log("unvalid coin.");
        }
    }
    console.log(amount)
});

document.getElementById('sell_btn').addEventListener("click", async (event) => {
    event.preventDefault()
    let available_coin = parseFloat(document.getElementById('available_of_coin').innerText)
    let sell_amount = parseFloat(document.getElementById('sell_amount').value)
    let the_coin = document.getElementById('the_coin').innerText
    let coin_value = parseFloat(document.getElementById(`t_c_coin_value_${the_coin.toLowerCase()}`).innerText)

    const d = new Date();
    let date = `${d.getMonth()}.${d.getDay()}`
    let time = `${d.getHours()}:${d.getMinutes()}`

    let No_open_orders = document.getElementById('No_open_orders')

    if (!available_coin || !coin_value) {
        console.log("not enought balance.")
    } else if (!sell_amount || (sell_amount <= 0)) {
        console.log("put a valid amount.")
    } else if (sell_amount > available_coin) {
        console.log("not enough Coin in balance.")
    } else if (coin_value <= 0) {
        console.log("unvalid coin value.")
    } else {
        await fetch("http://127.0.0.1:5000/api/save_sell", {
            method: "POST",
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: form_maker({
                "sell_amount":  sell_amount,
                "the_coin":     the_coin,
                "coin_value":   coin_value,
            })
        })
        .then(async res => {
            if (res.status == 200 || res.status == 201) {
                res.json().then( async resBody => {
                    if (resBody["status"] == "ok") {
                        console.log(resBody["status"])
                        console.log(resBody["msg"])
                        if (No_open_orders) {
                            document.getElementById('No_open_orders').style.display = "none";
                        }
                        
                        document.getElementById('inner_table').innerHTML = `
                            <div class="t_row">
                                <div> ${date} ${time} </div>
                                <div> ${the_coin}/USDT </div>
                                <div> Sell </div>
                                <div> ${(sell_amount * coin_value).toFixed(8)}  </div>
                                <div> Done </div>
                            </div>
                        ` + document.getElementById('inner_table').innerHTML

                        document.getElementById('available_of_usdt').innerText = 
                            parseFloat(document.getElementById('available_of_usdt').innerText) +
                            parseFloat((sell_amount * coin_value).toFixed(8));
                    } else {
                        console.log(resBody["status"])
                        console.log(resBody["msg"])
                    }
                })
            } else {
                console.log(res.status + " error")
            }
        })
        .catch(error => { console.log(error) });
    }
})
import {
    form_maker,
    coin_and_currency, 
    show_success,
    show_error
} from "./tools.js"

document.getElementById("invest_button").addEventListener("click", invest);

let error_item = document.getElementById("errors_wrapper");
let error_text_item = document.getElementById("error_text");

let usd_minimum = 0;
document.addEventListener("DOMContentLoaded", () => {
    usd_minimum = get_minimum_deposit()
})

async function get_minimum_deposit() {
    let minimum_deposit_span = document.getElementById("minimum_deposit_span")
    const [pay_currency, net] = coin_and_currency(coin)
    await fetch(`http://127.0.0.1:5000/api/get_minimum_deposit/${pay_currency}`, {
        method: "GET",
        headers: { "Access-Control-Allow-Origin": "*" },
    })
    .then(async res => {
        if (res.status == 200 || res.status == 201) {
            res.json().then( async resBody => {
                if (resBody["status"] == "ok") {
                    minimum_deposit_span.innerHTML = `
                    ${(resBody["usd_equivalent"] + (resBody["usd_equivalent"] / 10)).toFixed(8)} USD<br>&nbsp;
                    ${resBody["min_amount"]} ${coin}
                    `;
                    return resBody["usd_equivalent"]
                } else {
                    console.log(resBody["status"])
                    console.log(resBody["msg"])
                }
            })
        } else {
            console.log("getting minimum coins ro deposit problem.")
        }
    })
    .catch(error => { console.log(error) });    
}

async function invest(event) {
    event.preventDefault()

    error_item.style.visibility = "hidden"
    error_text_item.innerHTML = ""

    let coin_amount = parseFloat((document.getElementById('amount_in_usd').value).replace(',', '.'))
    let [pay_currency, net] = coin_and_currency(coin)

    let vals = document.getElementById('minimum_deposit_span').innerText.split(' ');
    let coin_value = (vals[0] / vals[2] + ((vals[0] / vals[2]) / 10)).toFixed(8);

    let usd_amount = (coin_value * coin_amount).toFixed(2);

    console.log(`${coin_amount} ${usd_amount} ${coin_value} ${pay_currency} `);

    let plan = document.getElementById('plans').getAttribute('data-plan');

    if (isNaN(coin_amount)) {
        show_error("The Amount should be in Numbers.")
    } else if (coin_amount < vals[2]) {
        show_error("The Amount is Lesser then the Minimum of investment.")
    } else {
        let invest_form = form_maker({
            'coin_amount': coin_amount,
            'usd_amount': usd_amount,
            'coin_value': coin_value,
            'coin': pay_currency,
            'plan': plan
        })

        await fetch("http://127.0.0.1:5000/api/invest", {
            method: "POST",
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: invest_form
        })
        .then(async res => {
            let resBody = await res.json()
            if (res.status == 200) {
                if (resBody["status"] == "ok") {
                    show_success("Your Investment starts, will be found in Investments page.")
                } else {
                    show_error(resBody["msg"])
                }
            } else {
                console.log(res.status)
            }
        })
        .catch(error => {
           console.log(error)
        });
    }
}
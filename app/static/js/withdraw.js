import {
    form_maker,
    coin_and_currency, 
    show_success,
    show_error
} from "./tools.js"

document.getElementById("withdraw_button").addEventListener("click", withdraw);

let error_item = document.getElementById("errors_wrapper");
let error_text_item = document.getElementById("error_text");



async function withdraw(event) {
    event.preventDefault()

    error_item.style.visibility = "hidden"
    error_text_item.innerHTML = ""

    let coin_amount = parseFloat((document.getElementById('amount_in_coin').value).replace(',', '.'))
    let withdraw_address = document.getElementById('withdraw_address').value
    let [pay_currency, net] = coin_and_currency(coin)

    

    if (isNaN(coin_amount)) {
        show_error("The Amount should be in Numbers.")

    } else if (coin_amount < 0) {
        show_error("The Amount is Lesser then 0.")

    } else if (withdraw_address == "") {
        show_error("Put a valid withdraw ddress.")

    } else {
        let withdraw_formBody = form_maker({
            "coin_amount":      coin_amount,
            "pay_currency":     pay_currency,
            "withdraw_address": withdraw_address,
        })

        await fetch("http://127.0.0.1:5000/api/withdraw_request", {
            method: "POST",
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: withdraw_formBody
        })
        .then(async res => {
            if (res.status == 200 || res.status == 201) {
                res.json().then( async resBody => {
                    if (resBody["status"] == "ok") {
                        console.log(resBody["status"])
                        show_success(resBody["msg"])
                    } else if (resBody["status"] == "limit") {
                        console.log(resBody["status"])
                        let vip = document.getElementById('vip')
                        vip.style.visibility = "visible"
                    } else {
                        show_error(resBody["msg"])
                    }
                })
            } else {
                show_error("withdraw Error")
            }
        })
        .catch(error => { console.log(error) });
    }
}
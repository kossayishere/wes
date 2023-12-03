import { form_maker , coin_and_currency } from "./tools.js"

document.getElementById("show_address_button").addEventListener("click", deposit);

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
                    if (resBody["usd_equivalent"] > 10 ) {
                        minimum_deposit_span.innerHTML = `
                            ${resBody["usd_equivalent"]} USD <br>
                            ${resBody["min_amount"]} ${coin}
                        `;
                    } else {
                        minimum_deposit_span.innerHTML = `
                            10 USD
                        `;
                    }
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

async function deposit(event) {
    event.preventDefault()

    error_item.style.visibility = "hidden"
    error_text_item.innerHTML = ""

    let usd_amount = parseFloat((document.getElementById('amount_in_usd').value).replace(',', '.'))
    let [pay_currency, net] = coin_and_currency(coin)

    if (isNaN(usd_amount)) {
        error_item.style.visibility = "visible"
        error_text_item.innerHTML = "The Amount should be in Numbers."
    } else if (usd_amount < usd_minimum) {
        error_item.style.visibility = "visible"
        error_text_item.innerHTML = "The Amount is Lesser then the Minimum in USD."
    } else {

        let deposit_formBody = form_maker({
            "price_amount":     usd_amount,
            "pay_currency":     pay_currency
        })
        
        await fetch("http://127.0.0.1:5000/api/deposit_request", {
            method: "POST",
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: deposit_formBody
        })
        .then(async res => {
            if (res.status == 200 || res.status == 201) {
                res.json().then( async resBody => {
                    if (resBody["status"] == "ok") {
                        select_address_wrapper.innerHTML = `
                            <div class="left_step">
                                <div class="step_number">
                                    5
                                </div>
                            </div>
                            <div class="right">
                                <span class="title">Deposit Infos</span><br>
                                <span class="description">
                                    Go to your other wallet and paste the address that you copied or you can scan QR code from your mobile device 
                                </span>
                                <div class="address_copy" id="show_address_wrapper">
                                    <input type="text" id="show_address" value="${resBody["pay_address"]}">
                                    <button id="copy_address_button" onclick="myFunc(event)">
                                        <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7.5 11.9058C7.5 9.53335 7.5 8.34712 8.23223 7.61008C8.96447 6.87305 10.143 6.87305 12.5 6.87305L13.3333 6.87305C15.6904 6.87305 16.8689 6.87305 17.6011 7.61008C18.3333 8.34712 18.3333 9.53336 18.3333 11.9058V12.7446C18.3333 15.1171 18.3333 16.3033 17.6011 17.0404C16.8689 17.7774 15.6904 17.7774 13.3333 17.7774H12.5C10.143 17.7774 8.96447 17.7774 8.23223 17.0404C7.5 16.3033 7.5 15.1171 7.5 12.7446L7.5 11.9058Z" stroke="#656E8B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                            <path d="M14.1669 6.87158C14.1649 4.39118 14.1276 3.1064 13.4104 2.22668C13.2718 2.05679 13.1171 1.90102 12.9483 1.76159C12.0263 1 10.6566 1 7.91699 1C5.17742 1 3.80764 1 2.88568 1.76159C2.7169 1.90102 2.56214 2.05679 2.42362 2.22668C1.66699 3.15468 1.66699 4.53345 1.66699 7.29098C1.66699 10.0485 1.66699 11.4273 2.42362 12.3553C2.56214 12.5252 2.7169 12.6809 2.88568 12.8204C3.75967 13.5423 5.03608 13.5799 7.50033 13.5819" stroke="#656E8B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                        &nbsp;Copy
                                    </button>
                                </div>
                                <span class="qr_code_span">Amount to Deposit: ${resBody["pay_amount"]} ${coin} over ${net} network</span>
                                <span class="qr_code_span">Qr Code :</span>
                                <img class="qr_code" src="http://127.0.0.1:5000/api/generate_qr/${resBody["pay_address"]}" width="250" height="250">
                                <span class="note_span">this Deposit request will be found in <a href="/profile/transactions">Transactions</a> page under ${resBody["payment_id"]} Trans ID.</span>
                            </div>
                        `;
                    } else {
                        console.log(resBody["status"])
                        error_item.style.visibility = "visible"
                        error_text_item.innerHTML = resBody["msg"]
                    }
                })
            } else {
                error_item.style.visibility = "visible"
                error_text_item.innerHTML = "address saving Error"
            }
        })
        .catch(error => { console.log(error) });
    }
}

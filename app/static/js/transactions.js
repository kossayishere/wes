setInterval( async function () {
    let there_are_deps = false;

    await fetch("http://127.0.0.1:5000/api/update_deposits", {
        method: "POST",
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        }
    })
    .then(async res => {
        resBody = await res.json()
        if (res.status == 200) {
            if (resBody["status"] == "ok") {
                data = JSON.parse(resBody["data"])
                ht = ``
                for (let t of data) {
                    ht += `
                    <div class="table_row">
                        <div data-paymentid="${t[2]}"> ${t[2]} </div>
                        <div> ${t[12].substr(5, 5)} ${t[12].substr(11, 5)}</div>
                        <div> Deposit </div>                                
                        <div> ${t[5]} </div>
                        <div> ${t[9].toUpperCase()} </div>
                        <div class="th_Amount_in_Coin_value"> ${t[7]} </div>
                        <div style=${t[3] == 'waiting' ? "color:orange;" : "color:green;"}> ${t[3]} </div>
                        <input type="text" class="th_Address_value" value="${t[4]}"/>
                    </div>
                    `
                }
                document.getElementById("inner_table").innerHTML = ht
                there_are_deps = true;
            } else {
                console.log(resBody["msg"])
                console.log("address saving Error")
            }
        } else {
            console.log("address saving Error")
        }
    })
    .catch(error => { console.log(error) });


    await fetch("http://127.0.0.1:5000/api/get_withdraws", {
        method: "POST",
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        }
    })
    .then(async res => {
        resBody = await res.json()
        if (res.status == 200 || res.status == 201) {
            if (resBody["status"] == "ok") {
                data = JSON.parse(resBody["data"])
                ht = ``
                for (let t of data) {
                    ht += `
                    <div class="table_row">
                        <div data-paymentid="${t[0]}"> ${t[0]} </div>
                        <div> ${t[7].substr(5, 5)} ${t[7].substr(11, 5)}</div>
                        <div> Withdraw </div>                                
                        <div> - </div>
                        <div> ${t[3].toUpperCase()} </div>
                        <div class="th_Amount_in_Coin_value"> ${t[1]} </div>
                        <div style=${t[5] == 0 ? "color:orange;" : "color:green;"}>
                            ${t[5] == 0 ? "waiting" : "done"} 
                        </div>
                        <input type="text" class="th_Address_value" value="${t[2]}"/>
                    </div>
                    `
                }
                if (there_are_deps) {
                    document.getElementById("inner_table").innerHTML += ht
                } else {
                    document.getElementById("inner_table").innerHTML = ht
                }
            } else {
                console.log(resBody["msg"])
                console.log("withdraws second Error")
            }
        } else {
            console.log("withdraws Error")
        }
    })
    .catch(error => { console.log(error) });
}, 5000);
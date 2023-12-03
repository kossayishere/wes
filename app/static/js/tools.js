function form_maker(data) {
    var formBody = [];
    for (var property in data) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(data[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    return formBody.join("&");
}

function coin_and_currency(coin) {
    let net = document.getElementById("network_left_select_btn_span").getAttribute("data-selected-net")
    let pay_currency = coin;
    if (coin != net) {
        pay_currency = coin+net
    }
    return [pay_currency, net]
}

function show_success(msg) {
    let error_element = document.querySelector("#errors_wrapper .error");

    document.getElementById("errors_wrapper").style.visibility = "visible";
    document.getElementById("error_text").innerHTML = msg;
    error_element.style.color = "darkgreen";
    error_element.style.backgroundColor = "lightgreen";
    error_element.style.borderColor = "green";
    document.getElementById("add").style.visibility = "hidden";
}

function show_error(msg) {
    let error_element = document.querySelector("#errors_wrapper .error");

    document.getElementById("errors_wrapper").style.visibility = "visible";
    document.getElementById("error_text").innerHTML = msg;
    error_element.style.color = "#FF0000";
    error_element.style.backgroundColor = "#FFCCCB";
    error_element.style.borderColor = "#FF0000";
    document.getElementById("add").style.visibility = "visible";
}

export { form_maker, coin_and_currency, show_success, show_error };
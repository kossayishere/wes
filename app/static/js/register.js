document.getElementById("reg_button").addEventListener("click", register)

var inputs = document.querySelectorAll('#reg_email, #reg_password_1, #reg_password_2');
error_item = document.getElementById("errors_wrapper");
error_text_item = document.getElementById("error_text");

inputs.forEach(function(inp) {
    inp.addEventListener("focus", function() {
        error_item.style.visibility = "hidden"
        error_text_item.innerHTML = ""
    });
})

function form_maker(data) {
    var formBody = [];
    for (var property in data) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(data[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    return formBody.join("&");
}

function validate_email(email) {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
}

async function register(event) {
    event.preventDefault()

    email = document.getElementById("reg_email").value;
    password_1 = document.getElementById("reg_password_1").value;
    password_2 = document.getElementById("reg_password_2").value;

    error_item = document.getElementById("errors_wrapper");
    error_text_item = document.getElementById("error_text");
    error = ""

    if (email == "")
        error = "Email is Empty."

    else if (password_1 == "")
        error = "Password is Empty."

    else if (password_2 == "")
        error = "Repeat Password is Empty."

    else if (password_1.length < 5)
        error = "the password must be 5 or more charachters."

    else if (password_1 != password_2)
        error = "Passwords are Not Equal."

    else if (!validate_email(email))
        error = "Email is not valid."

    if (error == "") {
        formBody = form_maker({'email': email, 'password': password_1})

        await fetch("http://127.0.0.1:5000/auth/register", {
            method: "POST",
            headers: {
                "Access-Control-Allow-Origin": "*",
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: formBody
        })
        .then(async res => {
            resBody = await res.json()
            if (res.status == 200) {
                if (resBody["status"] == "ok") {
                    window.location.href = "http://127.0.0.1:5000/auth/login";
                } else {
                    error_item.style.visibility = "visible"
                    error_text_item.innerHTML = resBody["msg"]
                }
            } else {
                error_item.style.visibility = "visible"
                error_text_item.innerHTML = resBody["msg"]
            }
        })
        .catch(error => {
           console.log(error)
        });
    } else {
        error_item.style.visibility = "visible"
        error_text_item.innerHTML = error
    }
}
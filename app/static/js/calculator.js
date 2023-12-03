const periods_btns = document.querySelector(".periods_btns")
const calc_amount = document.getElementById("calc_amount")
const calc_range = document.getElementById("calc_range")
const calc_btn = document.querySelector(".calc_btn")

const calc_profit_result = document.getElementById("calc_profit_result")
const calc_total_result = document.getElementById("calc_total_result")
const calc_percentage_result = document.getElementById("calc_percentage_result")

function change_total(value) {
    //calc_total_result.innerText = `${Math.round(value)} $`
    v = Math.round(value)
    calc_total_result.innerText = `${v} $`
}

function change_range(element, val, min, max) {
    element.style.backgroundSize = (val - min) * 100 / (max - min) + '% 100%'
}

function change_profit() {
    const TotalValue = calc_total_result.innerText.replace(/[^0-9]/g, '')
    calc_profit_result.innerText = `+${TotalValue - calc_amount.value} $`
}

multi_num = 1.1

calc_amount.oninput = function () {
    calc_range.value = calc_amount.value
    change_range(
        calc_range, 
        calc_range.value, 
        calc_range.min, 
        calc_range.max
    )
    change_total(calc_range.value * multi_num)
    change_profit()

    if (calc_amount.value === "") {
        calc_range.value = 0
        change_range(
            calc_range, 
            calc_range.value, 
            calc_range.min, 
            calc_range.max
        )
    }

    if (calc_amount.value > 10000) {
        calc_amount.value = 10000
        change_range(
            calc_range, 
            calc_range.value, 
            calc_range.min, 
            calc_range.max
        )
    }
};

calc_range.oninput = function () {
    calc_amount.value = calc_range.value
    change_range(
        calc_range, 
        calc_range.value, 
        calc_range.min, 
        calc_range.max
    )
    change_total(calc_range.value * multi_num)
    change_profit()
}

periods_btns.addEventListener('click', (e) => {
    if (e.target.classList.contains("calc_btn")) {
        for (const child of periods_btns.children) {
            child.classList.remove("active")
        }
        e.target.classList.add("active")
        switch (e.target.innerText) {
            case "1 week":
                multi_num = 1.1
                calc_percentage_result.innerText = '10%'
                change_total(calc_amount.value * multi_num)
                change_profit()
                break

            case "2 weeks":
                console.log("ko")
                multi_num = 1.25
                calc_percentage_result.innerText = '25%'
                change_total(calc_range.value * multi_num)
                change_profit()
                break

            case "1 month":
                multi_num = 1.7
                calc_percentage_result.innerText = '70%'
                change_total(calc_range.value * multi_num)
                change_profit()
                break

            case "3 months":
                multi_num = 3.5
                calc_percentage_result.innerText = '250%'
                change_total(calc_range.value * multi_num)
                change_profit()
                break
        }
    }
})
const selector = document.getElementById("areaCode") as HTMLInputElement

if (!selector) console.error("Area code input not found")

if (selector) {
    chrome.storage.local.get("areaCode", ({ areaCode }) => {
        const areaCodeOption = document.querySelector(`#areaCode-\\${areaCode}`) as HTMLOptionElement
        
        if (!areaCodeOption) return console.error("Area code option not found")

        areaCodeOption.selected = true
    })

    selector.addEventListener("change", () => {
        const areaCodeValue = selector.value

        chrome.storage.local.set({ areaCode: areaCodeValue }, () => {
            console.log("Area code changed to " + areaCodeValue)
        })
    })
}
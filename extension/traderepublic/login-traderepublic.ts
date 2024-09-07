let retry = 0
const maxRetry = 5

window.addEventListener("load", async() => {
    console.log("Login panel :", document.querySelector(".login__panel"))

    await getAreaCode()

    console.log("TradeRepublic content script loaded")
})

async function getAreaCode() {
    const { areaCode }  = await chrome.storage.local.get("areaCode")

    console.log("Area code from storage: ", areaCode)

    const element = document.querySelector(`.dropdownList__listbox ul li#areaCode-\\${areaCode}`) as HTMLElement

    if (!element) {

        if (retry < maxRetry) {
            console.error("! Element not found ! Retry: ", retry)

            retry++
            setTimeout(() => getAreaCode(), 500)
        } else {
            console.error("! Element not found ! Retry limit reached")
        }
    } else {
        console.log("Element found")

        element.click()
    }

}
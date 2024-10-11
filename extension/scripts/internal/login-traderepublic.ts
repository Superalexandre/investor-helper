/// <reference types="chrome" />

let retry = 0
const maxRetry = 5

window.addEventListener("load", async () => {
	console.log("Login panel :", document.querySelector(".login__panel"))

	await getAreaCode()

	console.log("TradeRepublic content script loaded")
})

async function getAreaCode() {
	// biome-ignore lint/correctness/noUndeclaredVariables: This is a global variable injected by the browser
	const { areaCode } = await chrome.storage.local.get("areaCode")

	console.log("Area code from storage: ", areaCode)

	const element = document.querySelector(`.dropdownList__listbox ul li#areaCode-\\${areaCode}`) as HTMLElement

	if (element) {
		console.log("Element found")

		element.click()
	} else if (retry < maxRetry) {
		console.error("! Element not found ! Retry: ", retry)

		retry++
		setTimeout(() => getAreaCode(), 500)
	} else {
		console.error("! Element not found ! Retry limit reached")
	}
}

/// <reference types="chrome" />

const selector = document.getElementById("areaCode") as HTMLSelectElement

if (!selector) {
	console.error("Area code input not found")
}

if (selector) {
	// biome-ignore lint/correctness/noUndeclaredVariables: This is a global variable injected by the browser
	chrome.storage.local.get("areaCode", ({ areaCode }) => {
		const areaCodeOption = document.querySelector(`#areaCode-\\${areaCode}`) as HTMLOptionElement

		if (!areaCodeOption) {
			return console.error("Area code option not found")
		}

		areaCodeOption.selected = true
	})

	selector.addEventListener("change", () => {
		const areaCodeValue = selector.value

		// biome-ignore lint/correctness/noUndeclaredVariables: This is a global variable injected by the browser
		chrome.storage.local.set({ areaCode: areaCodeValue }, () => {
			console.log(`Area code changed to ${areaCodeValue}`)
		})
	})
}

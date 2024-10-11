/// <reference types="chrome" />

const buttonNewTab = document.getElementsByClassName("new-tab") as HTMLCollectionOf<HTMLButtonElement>

if (buttonNewTab && buttonNewTab.length > 0) {
	for (const button of buttonNewTab) {
		const url = button.getAttribute("data-url")

		button.addEventListener("click", () => {
			// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
			chrome.tabs.create({
				url: url || "index.html"
			})
		})
	}
}

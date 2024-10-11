/// <reference types="chrome" />

// biome-ignore lint/correctness/noUndeclaredVariables: This is a global variable injected by the browser
chrome.runtime.onInstalled.addListener(() => {
	console.log("Extension installed")
})

/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed")
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received", message)
    sendResponse("Message received")
})
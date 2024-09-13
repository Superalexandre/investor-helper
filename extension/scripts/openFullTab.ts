/// <reference types="chrome" />

const buttonNewTab = document.getElementsByClassName("new-tab") as HTMLCollectionOf<HTMLButtonElement>

if (buttonNewTab && buttonNewTab.length > 0) {
    for (let i = 0; i < buttonNewTab.length; i++) {
        const button = buttonNewTab[i]

        const url = button.getAttribute("data-url")

        button.addEventListener("click", () => {
            chrome.tabs.create({
                url: url || "index.html"
            })
        })
    }

}
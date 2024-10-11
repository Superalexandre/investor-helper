//http://82.64.99.107/api/news

const newsComponent = document.getElementsByClassName("news")[0]

if (newsComponent) {
	fetch("http://82.64.99.107/api/news").then((response) => {
		response.json().then((data) => {
			for (const news of data) {
				const newsElement = document.createElement("div")
				newsElement.className = "news-item"
				newsElement.innerHTML = `
                    <div class="news-title">${news.title}</div>
                `

				document.getElementsByClassName("news-list")[0].appendChild(newsElement)
				document.getElementsByClassName("loading")[0].classList.add("hidden")
			}
		})
	})
}

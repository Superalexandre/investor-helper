import type { MetaFunction } from "react-router";
import Content from "./content.mdx"
import BackButton from "../../components/button/backButton"

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Conditions d'utilisation"
	const description =
		"Consultez les conditions d'utilisation d'Investor Helper pour en savoir plus sur les règles d'utilisation de notre site web et de nos services en ligne."

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ tagName: "link", rel: "canonical", href: "https://www.investor-helper.com/terms" },
		{ name: "robots", content: "noindex" }
	]
}

export default function Index() {
	return (
		<div className="relative flex flex-col items-center gap-10">
			<BackButton />

			<Content />
		</div>
	)
}

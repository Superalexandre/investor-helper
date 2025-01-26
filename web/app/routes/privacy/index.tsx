import type { MetaFunction } from "react-router";
import Content from "./content.mdx"
import BackButton from "../../components/button/backButton"

export const meta: MetaFunction = () => {
	const title = "Investor Helper - Politique de confidentialité"
	const description =
		"Consultez la politique de confidentialité d'Investor Helper pour en savoir plus sur la manière dont nous collectons, utilisons et partageons vos données."

	return [
		{ title: title },
		{ name: "og:title", content: title },
		{ name: "description", content: description },
		{ name: "og:description", content: description },
		{ tagName: "link", rel: "canonical", href: "https://www.investor-helper.com/privacy" },
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

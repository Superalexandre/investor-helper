type Options = Intl.DateTimeFormatOptions & { locale?: string }

export default function formatDate(
	date: number,
	options: Options = {
		locale: "fr-FR",
		day: "numeric",
		month: "long",
		year: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric"
	}
) {
	return new Date(date).toLocaleDateString(options.locale, options)
}

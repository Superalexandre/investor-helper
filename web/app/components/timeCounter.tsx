import { useEffect, useState } from "react"

export default function TimeCounter({
	date,
	// Twenty minutes
	diffOngoing = 1000 * 60 * 20,
	diff,
	separator = true
}: { date: string; diff?: number; diffOngoing?: number; separator?: boolean }) {
	const eventDate = new Date(date)
	const now = new Date()

	const [time, setTime] = useState<number>(eventDate.getTime() - now.getTime())

	useEffect(() => {
		const interval = setInterval(() => {
			const newDate = new Date()

			setTime(eventDate.getTime() - newDate.getTime())
		}, 1000)

		return () => clearInterval(interval)
	}, [eventDate.getTime])

	const diffBetween = eventDate.getTime() - now.getTime()

	// Check if the event is ongoing
	if (diffBetween > -diffOngoing && diffBetween < 0) {
		return (
			<>
				{separator ? <span className="hidden lg:block">-</span> : null}
				<span className="text-center text-sky-500">Événement en cours</span>
			</>
		)
	}

	// Check if the event is over
	if (diffBetween < -diffOngoing && diffBetween < 0) {
		const diff = Math.abs(diffBetween)
		const prettyTime = getPrettyTime(diff)

		return (
			<>
				{separator ? <span className="hidden lg:block">-</span> : null}
				<span className="text-center">Terminé depuis {prettyTime}</span>
			</>
		)
	}

	if (diff && diffBetween > diff) {
		return null
	}

	// Format the time with date-fns
    const prettyTime = getPrettyTime(time)

	return (
		<>
			{separator ? <span className="hidden lg:block">-</span> : null}
			<span className="text-center">Dans {prettyTime}</span>
		</>
	)
}

function getPrettyTime(time: number) {
	const days = Math.floor(time / (1000 * 60 * 60 * 24))
	const hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
	const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((time % (1000 * 60)) / 1000)

	let prettyTime = ""

	if (days > 0) {
		prettyTime += `${days}j `
	}

	if (hours > 0) {
		prettyTime += `${hours}h `
	}

	if (minutes > 0) {
		prettyTime += `${minutes}m `
	}

	if (seconds > 0) {
		prettyTime += `${seconds}s`
	}

	return prettyTime
}
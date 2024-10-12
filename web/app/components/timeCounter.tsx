import { useEffect, useState } from "react"

export default function TimeCounter({
	date,
	diff,
	separator = true
}: { date: string; diff?: number; separator?: boolean }) {
	const [time, setTime] = useState<number>(0)

	const eventDate = new Date(date)
	const now = new Date()

	useEffect(() => {
		const interval = setInterval(() => {
			const newDate = new Date()

			setTime(eventDate.getTime() - newDate.getTime())
		}, 1000)

		return () => clearInterval(interval)
	}, [eventDate.getTime])

	const diffBetween = eventDate.getTime() - now.getTime()

	if (diffBetween < 0) {
		return (
			<>
				{separator ? <span className="hidden lg:block">-</span> : null}
				<span className="text-center text-sky-500">Événement en cours</span>
			</>
		)
	}

	if (diff && diffBetween > diff) {
		return null
	}

	// Format the time with date-fns
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

	return (
		<>
			{separator ? <span className="hidden lg:block">-</span> : null}
			<span className="text-center">Dans {prettyTime}</span>
		</>
	)
}

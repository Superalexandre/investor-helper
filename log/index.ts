import winston from "winston"
import type { Logger } from "winston"
import chalk from "chalk"

import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logDir = `${__dirname}/logs`

interface CustomLogger extends Logger {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	critical: (message: string, ...meta: any[]) => void
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	success: (message: string, ...meta: any[]) => void
}

function colorizeLevel(level: string): string {
	if (level.toLowerCase() === "critical") {
		return chalk.magenta(level)
	}

	if (level.toLowerCase() === "error") {
		return chalk.red(level)
	}

	if (level.toLowerCase() === "info") {
		return chalk.blue(level)
	}

	if (level.toLowerCase() === "warn") {
		return chalk.yellow(level)
	}

	if (level.toLowerCase() === "success") {
		return chalk.green(level)
	}

	return level
}

const consoleFormat = winston.format.printf(({ level, message, timestamp }) => {
	const colorizedLevel = colorizeLevel(level.toUpperCase())

	return `[${timestamp}][${colorizedLevel}] ${message}`
})

const dateFormat = "DD/MM/YYYY HH:mm:ss"

const logger = winston.createLogger({
	levels: {
		critical: 0,
		error: 1,
		warn: 2,
		success: 3,
		info: 4,
		http: 5,
		debug: 6
	},
	level: "info",
	format: winston.format.combine(winston.format.timestamp({ format: dateFormat }), winston.format.json()),
	defaultMeta: { service: "user-service" },
	transports: [
		new winston.transports.Console({ level: 'critical' }),
		new winston.transports.File({ filename: `${logDir}/error.log`, level: "error" }),
		new winston.transports.File({ filename: `${logDir}/combined.log` }),
		new winston.transports.Console({
			format: winston.format.combine(winston.format.timestamp({ format: dateFormat }), consoleFormat)
		})
	],

}) as CustomLogger

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
logger.success = (message: string, ...meta: any[]): void => {
	logger.log({
		level: "success",
		message,
		meta
	})
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
logger.critical = (message: string, ...meta: any[]): void => {
	logger.log({
		level: "error",
		message,
		meta
	})
}

export default logger

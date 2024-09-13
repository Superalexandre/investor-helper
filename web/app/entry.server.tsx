import { PassThrough } from "node:stream"

import type { EntryContext } from "@remix-run/node"
import { createReadableStreamFromReadable } from "@remix-run/node"
import { RemixServer } from "@remix-run/react"
import { isbot } from "isbot"
import { renderToPipeableStream } from "react-dom/server"

const ABORT_DELAY = 5_000

export default function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    remixContext: EntryContext,
    // loadContext: AppLoadContext,
) {
    const callbackName = isbot(request.headers.get("user-agent"))
        ? "onAllReady"
        : "onShellReady"

    return new Promise((resolve, reject) => {
        let didError = false

        const { pipe, abort } = renderToPipeableStream(
            <RemixServer
                context={remixContext}
                url={request.url}
                abortDelay={ABORT_DELAY}
            />,
            {
                [callbackName]: () => {
                    const body = new PassThrough()
                    const stream = createReadableStreamFromReadable(body)

                    responseHeaders.set("Content-Type", "text/html")

                    const response = new Response(stream, {
                        headers: responseHeaders,
                        status: didError ? 500 : responseStatusCode,
                    })

                    resolve(response)

                    pipe(body)
                    resolve(response)
                },
                onShellError(error: unknown) {
                    reject(error)
                },
                onError(error: unknown) {
                    didError = true

                    console.error(error)
                }
            },
        )

        setTimeout(abort, ABORT_DELAY)
    })
}
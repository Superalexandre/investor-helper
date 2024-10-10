import { ClientLoaderFunctionArgs } from "@remix-run/react"

export async function loader({
    request
}: ClientLoaderFunctionArgs) {
    const requestUrl = new URL(request.url)
    const imageName = requestUrl.searchParams.get("name")
    
    if (!imageName) return new Response(null, {
        status: 400
    })

    const url = `https://s3-symbol-logo.tradingview.com/${imageName}.svg`
    const imageReq = await fetch(url)
    
    if (!imageReq.ok) return null

    const imageBlob = await imageReq.blob()
    return new Response(imageBlob, {
        headers: {
            "Content-Type": "image/svg+xml"
        }
    })
}
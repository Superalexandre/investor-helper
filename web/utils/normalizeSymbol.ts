function normalizeSymbol(symbol: string) {
    const symbolParts = symbol.split("/")

    if (symbolParts.length < 2) return symbol

    return symbolParts.join(":")
}

function reverseNormalizeSymbol(symbol: string) {
    const symbolParts = symbol.split(":")

    if (symbolParts.length < 2) return symbol

    return `${symbolParts[0]}:${symbolParts.slice(1).join("/")}`
}

function normalizeSymbolHtml(symbol: string) {
    return symbol.replace(/<[^>]*>/g, "")
}

export { normalizeSymbol, reverseNormalizeSymbol, normalizeSymbolHtml }
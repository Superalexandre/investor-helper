export default {
    language: "fr",

    url: {
        originLocale: "https://fr.tradingview.com",
        eventsOrigin: "https://www.tradingview.com",
        events: "https://economic-calendar.tradingview.com/events",
        news: "https://fr.tradingview.com/news/markets"
    },

    calendarPreferences: {
        filename: "calendar.ics",
        numberOfDays: 14,

        /*
        Country list :
        "KR", "AU", "JP", "CA", "US", "ID", "CN", "IN", "RU", "TR", "IT", "FR", "DE", "EU", "GB", "ZA", "MX", "BR", "AR", "SA"

        Currency list :
        "KRW", "AUD", "JPY", "CAD", "USD", "IDR", "CNY", "INR", "RUB", "TRY", "EUR", "GBP", "ZAR", "MXN", "BRL", "ARS", "SAR"

        Importance list :
        "low", "medium", "high"
        */

        filters: [
            {
                country: ["FR"],
                importance: ["low", "medium", "high"]
            },
            {
                country: ["DE", "EU", "US"],
                importance: ["medium", "high"]
            }
        ],
    }
}
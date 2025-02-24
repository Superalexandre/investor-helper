import type { ReactNode } from 'react'
import { createRootRoute, Outlet, Scripts, ScrollRestoration, HeadContent } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { toast as sonner } from 'sonner'
import { Link } from '@tanstack/react-router'
import i18next from '../i18next.server'
import { useTranslation } from 'react-i18next'
import { useChangeLanguage } from 'remix-i18next/react'
import { getUser } from '../session.server'
import { getTheme } from '../lib/getTheme'
import { getNotificationListNumber } from '../../utils/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/remix'
// import { useSWEffect } from '../hooks/pwa/useSWEEffect'
import Header from '@/components/header'
import stylesheet from '@/tailwind.css?url'
import { TFunction } from 'i18next'

export const Route = createRootRoute({
    component: RootComponent,
    head(ctx) {
        return {
            meta: [
                { charSet: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { title: 'Investor Helper' },
            ],
            links: [{ rel: 'stylesheet', href: stylesheet, as: 'style', type: 'text/css' }],
        }
    },
    
})


// Loader pour récupérer les données nécessaires
// export const loader = async ({ request }) => {
//   const [user, theme, locale] = await Promise.all([
//     getUser(request), 
//     getTheme(request),
//     i18next.getLocale(request)
//   ])

//   let notificationNumber = 0
//   if (user) {
//     notificationNumber = await getNotificationListNumber(user.id)
//   }

//   return { logged: user !== null, user, locale, theme, notificationNumber }
// }

// Définir les liens CSS
// export const links = () => [{ rel: "stylesheet", href: stylesheet, as: "style", type: "text/css" }]

// Définir la route racine avec l'intégration de Meta, Head, Scripts...
// export const Route = createRootRoute({
//   head: () => ({
//     meta: [
//       { charSet: 'utf-8' },
//       { name: 'viewport', content: 'width=device-width, initial-scale=1' },
//       { title: 'Investor Helper' },
//     ],
//   }),
//   component: Layout,
// })

function Layout({ children }: { children: ReactNode }) {
    //   const data = useRouteLoaderData<typeof loader>('root')
    // const { i18n, t } = useTranslation('common')

    const t = (key: string) => key as unknown as TFunction

    // useSWEffect()

    //   const locale = data?.locale ?? 'fr-FR'
    //   const theme = data?.theme ?? 'light'

    //   useChangeLanguage(locale)

    return (
        <html lang={"fr-FR"} dir={""} className={"dark bg-background"} translate="no"
            data-theme={"dark"}
        >
            <head>
                {/* <MetaContent /> */}
                <HeadContent />
            </head>
            <body className="flex min-h-screen flex-col">
                <Header user={null} t={t} notificationNumber={0} />

                <main>{children}</main>

                <Toaster />
                <Sonner expand={false} visibleToasts={3} />

                {/* <ScrollRestoration /> */}
                <Scripts />
            </body>
        </html>
    )
}

// export default function App(): ReactNode {
//   const [queryClient] = useState(() => new QueryClient())

//   useEffect(() => {
//     if ('serviceWorker' in navigator) {
//       const handleMessages = (event: MessageEvent): void => {
//         if (event.data?.type === 'notification') {
//           const id = Date.now().toString()

//           sonner(event.data.title, {
//             description: event.data.body,
//             closeButton: true,
//             id: id,
//             className: 'flex justify-between',
//             action: (
//               <Link
//                 to={event.data.url}
//                 onClick={() => sonner.dismiss(id)}
//               >
//                 <Button type="button" variant="default">
//                   Ouvrir
//                 </Button>
//               </Link>
//             ),
//           })
//         }
//       }

//       navigator.serviceWorker.addEventListener('message', handleMessages)

//       return () => {
//         navigator.serviceWorker.removeEventListener('message', handleMessages)
//       }
//     }
//   }, [])

//   return (
//     <QueryClientProvider client={queryClient}>
//       <NuqsAdapter>
//         <Outlet />
//       </NuqsAdapter>
//     </QueryClientProvider>
//   )
// }

// Gestion des erreurs (error boundary)
export function ErrorBoundary(): ReactNode {

    return (
        <p>Erreur</p>
    )

    // const { t } = useTranslation('common')
    // const error = useRouteError()

    // if (isRouteErrorResponse(error)) {
    //     return (
    //         <div className="flex flex-grow flex-col items-center justify-center gap-4">
    //             <h1 className="font-bold text-3xl">{t("error.errorTitle")}</h1>
    //             <p className="text-center">{t("error.errorMessage")}</p>
    //             <Link to="/">
    //                 <Button type="button" variant="default">
    //                     {t("backHome")}
    //                 </Button>
    //             </Link>
    //         </div>
    //     )
    // }

    // return (
    //     <div className="flex flex-grow flex-col items-center justify-center gap-4">
    //         <h1 className="font-bold text-3xl">{t("error.genericError")}</h1>
    //         <Link to="/">
    //             <Button type="button" variant="default">
    //                 {t("backHome")}
    //             </Button>
    //         </Link>
    //     </div>
    // )
}


function RootComponent(): ReactNode {
    return (
        <Layout>
            <Outlet />
        </Layout>
    )
}

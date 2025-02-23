// app/router.tsx
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { routeTree } from './routeTree.gen'
import { QueryClient } from '@tanstack/react-query'

export function createRouter() {
    const queryClient = new QueryClient()

    return routerWithQueryClient(
        createTanStackRouter({
            routeTree,
            context: { queryClient },
            defaultPreload: 'intent',
            defaultErrorComponent: () => {
                return <p>Error (router)</p>
            },
            defaultNotFoundComponent: () => {
                return <p>Not found (router)</p>
            }
        }),
        queryClient,
    )
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof createRouter>
    }
}
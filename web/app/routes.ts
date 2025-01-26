import { index, type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";
// import { flatRoutes } from 'remix-flat-routes'
// import { remixRoutesOptionAdapter } from "@react-router/remix-routes-option-adapter"

export default flatRoutes() satisfies RouteConfig;
// export default remixRoutesOptionAdapter((defineRoutes) => {
//     return flatRoutes("routes", defineRoutes)
// })
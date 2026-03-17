import { type RouteConfig, index, layout, route } from "@react-router/dev/routes"

export default [
    layout("routes/auth-layout.tsx", [index("routes/index.tsx")]),
    route("api/auth/*", "routes/api.auth.$.tsx"),
] satisfies RouteConfig

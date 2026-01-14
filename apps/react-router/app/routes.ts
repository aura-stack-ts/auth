import { type RouteConfig, index, layout, route } from "@react-router/dev/routes"

export default [
    layout("routes/auth-layout.tsx", [index("routes/index.tsx"), route("auth/*", "routes/auth.$.tsx")]),
] satisfies RouteConfig

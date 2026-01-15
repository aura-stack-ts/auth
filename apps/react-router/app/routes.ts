import { type RouteConfig, index, layout, route } from "@react-router/dev/routes"

export default [
    layout("routes/auth-layout.tsx", [
        layout("routes/split-layout.tsx", [
            index("routes/server.tsx"),
            route("client", "routes/client.tsx")
        ]),
        route("auth/*", "routes/auth.$.tsx")
    ]),
] satisfies RouteConfig

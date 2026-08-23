import { type RouteConfig, index, layout, route } from "@react-router/dev/routes"

export default [
    layout("routes/auth-layout.tsx", [
        index("routes/index.tsx"),
        route("server", "routes/server/index.tsx"),
        route("client", "routes/client/index.tsx"),
        route("client/sign-in", "routes/client/sign-in/index.tsx"),
        route("client/sign-up", "routes/client/sign-up/index.tsx"),
        route("client/profile", "routes/client/profile/index.tsx"),
        route("server/sign-in", "routes/server/sign-in/index.tsx"),
        route("server/sign-up", "routes/server/sign-up/index.tsx"),
        route("server/profile", "routes/server/profile/index.tsx"),
    ]),
    route("api/auth/*", "routes/api.auth.$.tsx"),
] satisfies RouteConfig

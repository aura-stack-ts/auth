import { createAuth } from "@aura-stack/auth"

const auth = createAuth({
    oauth: ["github"],
    secret: process.env.AURA_AUTH_SECRET ?? process.env.NEXT_PUBLIC_AURA_AUTH_SECRET,
})

export const GET = async (request: Request) => {
    //return auth.handlers.GET(request)
    console.log("GET /auth/[...aura]", auth.handlers)
    return Response.json({ message: "Not implemented" })
}

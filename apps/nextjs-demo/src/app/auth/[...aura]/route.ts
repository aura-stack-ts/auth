import { createAuth } from "@aura-stack/auth"

const auth = createAuth({
    oauth: ["github"]
})

export const GET = async (request: Request) => {
    //return auth.handlers.GET(request)
    console.log("GET /auth/[...aura]", auth.handlers)
    return Response.json({ message: "Not implemented" })
}
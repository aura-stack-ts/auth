// Is this the error ?
import { handlers } from "@/auth"
//export const { GET, POST } = handlers

export const GET = async (req: Request) => {
    console.log("handlers: ", handlers, "GET: ", await handlers?.GET(req))
    return Response.json({ message: "Auth route is not configured." }, { status: 501 })
}

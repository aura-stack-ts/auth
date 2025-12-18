// Is this the error ?
//import { handlers } from "@/auth"
//export const { GET, POST } = handlers

export const GET = async () => {
    return Response.json({ message: "Auth route is not configured." }, { status: 501 })
}

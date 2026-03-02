import { handlers } from "../_auth.js";

export const GET = async (request: Request) => {
    return await handlers.GET(request);
}

export const POST = async (request: Request) => {
    return await handlers.POST(request);
}
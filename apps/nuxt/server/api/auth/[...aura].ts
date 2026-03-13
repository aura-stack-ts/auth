import { handlers } from "#shared/auth"

export default defineEventHandler(async (event) => {
    const webRequest = toWebRequest(event)
    return await handlers.ALL(webRequest)
})

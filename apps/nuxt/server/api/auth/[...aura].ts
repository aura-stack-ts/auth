import { handlers } from "#shared/auth"

export default defineEventHandler(async (event) => {
    const method = event.method
    const handler = handlers[method as keyof typeof handlers]
    if (!handler) {
        throw createError({
            statusCode: 405,
            statusMessage: `Method ${method} Not Allowed`,
        })
    }
    const webRequest = toWebRequest(event)
    const response = await handler(webRequest)
    return response
})

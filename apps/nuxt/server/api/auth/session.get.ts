import { api } from "~/shared/auth"

export default defineEventHandler(async (event) => {
    const response = await api.getSession({
        headers: getHeaders(event) as Record<string, string>,
    })

    return response.success ? response.session : null
})

import { parseSetCookie } from "@aura-stack/auth/cookies"

export const getSessionToken = (response: Response) => {
    const cookie = response.headers.getSetCookie()?.find((cookie) => cookie.startsWith("aura-auth.session_token="))
    const parsed = parseSetCookie(cookie!)
    return {
        cookie,
        tokenValue: parsed?.value,
    }
}

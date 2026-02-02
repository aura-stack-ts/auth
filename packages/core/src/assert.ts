import { equals } from "@/utils.js"
import type { JWTPayloadWithToken } from "@/@types/index.js"

export const isFalsy = (value: unknown): boolean => {
    return value === false || value === 0 || value === "" || value === null || value === undefined || Number.isNaN(value)
}

export const isRequest = (value: unknown): value is Request => {
    return typeof Request !== "undefined" && value instanceof Request
}

export const unsafeChars = [
    "<",
    ">",
    '"',
    "`",
    " ",
    "\r",
    "\n",
    "\t",
    "\\",
    "%2F",
    "%5C",
    "%2f",
    "%5c",
    "\r\n",
    "%0A",
    "%0D",
    "%0a",
    "%0d",
    "..",
    "..",
    "//",
    "///",
    "...",
    "%20",
    "\0",
]

export const isValidURL = (value: string): boolean => {
    if (!new RegExp(/^https?:\/\/[^/]/).test(value)) {
        return false
    }
    const match = value.match(/^(https?:\/\/)(.*)$/)
    if (!match) return false
    const rest = match[2]
    for (const char of unsafeChars) {
        if (rest.includes(char)) return false
    }
    const regex =
        /^https?:\/\/(?:[a-zA-Z0-9._-]+|localhost|\[[0-9a-fA-F:]+\])(?::\d{1,5})?(?:\/[a-zA-Z0-9._~!$&'()?#*+,;=:@-]*)*\/?$/

    return regex.test(match[0])
}

export const isJWTPayloadWithToken = (payload: unknown): payload is JWTPayloadWithToken => {
    return typeof payload === "object" && payload !== null && "token" in payload && typeof payload?.token === "string"
}

export const isRelativeURL = (value: string): boolean => {
    if (value.length > 100) return false
    for (const char of unsafeChars) {
        if (value.includes(char)) return false
    }
    const regex = /^\/[a-zA-Z0-9\-_\/.?&=#]*\/?$/
    return regex.test(value)
}

export const isSameOrigin = (origin: string, expected: string): boolean => {
    const originURL = new URL(origin)
    const expectedURL = new URL(expected)
    return equals(originURL.origin, expectedURL.origin)
}

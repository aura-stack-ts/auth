export const isFalsy = (value: unknown): boolean => {
    return value === false || value === 0 || value === "" || value === null || value === undefined || Number.isNaN(value)
}

export const isRequest = (value: unknown): value is Request => {
    return typeof Request !== "undefined" && value instanceof Request
}

export const isValidURL = (value: string): boolean => {
    if (value.includes("\r\n") || value.includes("\n") || value.includes("\r")) return false
    const regex = /^https?:\/\/(?:[a-zA-Z0-9._-]+|localhost|\[[0-9a-fA-F:]+\])(?::\d{1,5})?(?:\/[a-zA-Z0-9._~!$&'()*+,;=:@-]*)*\/?$/
    return regex.test(value)
}
export const toFormBody = (params: Record<string, string>): URLSearchParams => {
    return new URLSearchParams(params)
}

export const formHeaders = (extra?: HeadersInit): HeadersInit => ({
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
    ...extra,
})

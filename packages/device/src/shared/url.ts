export const resolveUrl = (config: string | { url: string }): string => {
    return typeof config === "string" ? config : config.url
}

export const resolveScope = (
    deviceAuthorization: string | { url: string; params?: { scope?: string } },
    providerScope?: string
): string | undefined => {
    if (typeof deviceAuthorization === "object" && deviceAuthorization.params?.scope) {
        return deviceAuthorization.params.scope
    }
    return providerScope
}

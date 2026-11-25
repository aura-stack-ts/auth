export const extractPath = (url: string): string => {
    const pathRegex = /^https?:\/\/[a-zA-Z0-9_\-.]+(:\d+)?(\/.*)$/
    const match = url.match(pathRegex)
    return match && match[2] ? match[2] : "/"
}

/**
 * Converts a trusted origin pattern to a regex for matching.
 * Supports `*` as subdomain wildcard: `https://*.example.com` matches `https://app.example.com`
 * @todo: add support to Custom URI Schemes (e.g. `myapp://*`).
 */
export const patternToRegex = (pattern: string): RegExp | null => {
    try {
        if (pattern.length > 2048) return null

        pattern = pattern.replace(/\\/g, "")
        const match = pattern.match(/^(https?):\/\/([a-zA-Z0-9.*-]{1,253})(?::(\d{1,5}|\*))?(?:\/.*)?$/)
        if (!match) return null

        const [, protocol, host, port] = match
        const hasWildcard = host.includes("*")
        if (hasWildcard && !host.startsWith("*.")) return null
        if (hasWildcard && !host.startsWith("*.")) return null
        if (hasWildcard && host.slice(2).includes("*")) return null

        const domain = hasWildcard ? host.slice(2) : host
        const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const hostRegex = hasWildcard ? `[^.]+\\.${escapedDomain}` : escapedDomain
        const portRegex = port === "*" ? ":\\d{1,5}" : port ? `:${port}` : ""

        return new RegExp(`^${protocol}:\\/\\/${hostRegex}${portRegex}$`)
    } catch {
        return null
    }
}

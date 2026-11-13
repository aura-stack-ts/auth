import { equals, extractPath, patternToRegex } from "@/shared/utils.ts"
import { isRelativeURL, isSameOrigin, isTrustedOrigin, isValidURL } from "@/shared/utils/get-origin-url.ts"

export const getSafeURL = ({
    baseURL,
    url,
    trustedOrigins,
}: {
    baseURL: string
    url: string
    trustedOrigins: string[]
}): string | null => {
    try {
        if (!isRelativeURL(url) && !isValidURL(url)) return null
        if (isRelativeURL(url)) return url
        if (trustedOrigins.length > 0) {
            if (isTrustedOrigin(url, trustedOrigins)) {
                const urlOrigin = new URL(url).origin
                for (const pattern of trustedOrigins) {
                    const regex = patternToRegex(pattern)
                    if (regex?.test(urlOrigin)) {
                        return isSameOrigin(url, baseURL) ? extractPath(url) : url
                    }
                    if (isValidURL(pattern) && equals(new URL(pattern).origin, urlOrigin)) return url
                }
            }
            return null
        }
        if (isSameOrigin(baseURL, url)) {
            return extractPath(url)
        }
        return null
    } catch {
        return null
    }
}

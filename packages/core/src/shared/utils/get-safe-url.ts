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
                const originURL = new URL(url).origin
                for (const safeOrigin of trustedOrigins) {
                    const regex = patternToRegex(safeOrigin)
                    if (regex?.test(originURL)) {
                        return isSameOrigin(url, baseURL) ? extractPath(url) : url
                    }
                    if (isValidURL(safeOrigin) && equals(new URL(safeOrigin).origin, originURL)) return url
                }
            }
            return null
        }
        if (isSameOrigin(url, baseURL)) {
            return extractPath(url)
        }
        return null
    } catch {
        return null
    }
}

const COOKIE_PREFIX = "aura-stack"

export const defaultCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
}

/**
 * Future: implements __Host- prefix for cookies set on secure connections
 *
 * @param {boolean} secure Whether to set the Secure flag on cookies
 * @returns
 */
export const createCookieStore = (secure: boolean = false) => {
    const securePrefix = secure ? "__Secure-" : ""
    return {
        sessionToken: {
            name: `${securePrefix}${COOKIE_PREFIX}.session_token`,
            options: {
                ...defaultCookieOptions,
                secure,
            },
        },
        csrfToken: {
            name: `${securePrefix}${COOKIE_PREFIX}.csrf_token`,
            options: {
                ...defaultCookieOptions,
                secure,
            },
        },
        state: {
            name: `${securePrefix}${COOKIE_PREFIX}.state`,
            options: {
                ...defaultCookieOptions,
                secure,
            },
        },
        pkce: {
            name: `${securePrefix}${COOKIE_PREFIX}.pkce`,
            options: {
                ...defaultCookieOptions,
                secure,
            },
        },
        nonce: {
            name: `${securePrefix}${COOKIE_PREFIX}.nonce`,
            options: {
                ...defaultCookieOptions,
                secure,
            },
        },
    }
}

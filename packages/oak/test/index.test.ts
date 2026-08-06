import { equal, assertNotEquals, assertExists } from "@std/assert"
import { app, jose } from "./app.ts"
import { createCSRF } from "@aura-stack/auth/crypto"
import type { JWTPayload } from "@aura-stack/jose/jose"

export const sessionPayload: JWTPayload = {
    sub: "1234567890",
    email: "john@example.com",
    name: "John Doe",
    image: "https://example.com/image.jpg",
}

const createSessionToken = async (payload: JWTPayload): Promise<string> => {
    return await jose.encodeJWT(payload)
}

const createCSRFToken = async (): Promise<string> => {
    return await createCSRF(jose)
}

const handler = async (request: Request): Promise<Response> => {
    return (await app.handle(request)) as Response
}

Deno.test("signIn to GitHub", async () => {
    const response = await handler(new Request("http://localhost:3000/api/auth/signIn/github"))
    assertNotEquals(response, undefined)
    equal(response.status, 302)
})

Deno.test("signIn to GitHub with redirect=false", async () => {
    const response = await handler(new Request("http://localhost:3000/api/auth/signIn/github?redirect=false"))
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    equal(body.success, true)
    equal(body.redirect, false)
    assertExists(body.signInURL)
})

Deno.test("signIn to GitHub with custom redirectTo", async () => {
    const response = await handler(new Request("http://localhost:3000/api/auth/signIn/github?redirectTo=/dashboard"))
    assertNotEquals(response, undefined)
    equal(response.status, 302)
})

Deno.test("signIn with invalid provider", async () => {
    const response = await handler(new Request("http://localhost:3000/api/auth/signIn/invalidprovider"))
    assertNotEquals(response, undefined)
    equal(response.status, 404)
})

Deno.test("signInCredentials with valid credentials", async () => {
    const response = await handler(
        new Request("http://localhost:3000/api/auth/signIn/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "testuser",
                password: "validpassword",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    equal(body.success, true)
})

Deno.test("signInCredentials with invalid credentials", async () => {
    const response = await handler(
        new Request("http://localhost:3000/api/auth/signIn/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "testuser",
                password: "invalid",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 401)
})

Deno.test("signInCredentials with missing fields", async () => {
    const response = await handler(
        new Request("http://localhost:3000/api/auth/signIn/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "testuser",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 400)
})

Deno.test("signUp with valid data", async () => {
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/signUp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    equal(body.success, true)
})

Deno.test("signUp with invalid data", async () => {
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/signUp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({
                firstName: "John",
                lastName: "Doe",
                email: "invalid-email",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 400)
})

Deno.test("signUp with missing fields", async () => {
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/signUp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: `aura-auth.aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
            body: JSON.stringify({
                firstName: "John",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 400)
})

Deno.test("signOut with valid session", async () => {
    const sessionToken = await createSessionToken(sessionPayload)

    const response = await handler(
        new Request("http://localhost:3000/api/auth/signOut", {
            method: "POST",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}`,
            },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 202)

    const body = await response.json()
    equal(body.success, true)
})

Deno.test("signOut with redirect=true", async () => {
    const sessionToken = await createSessionToken(sessionPayload)

    const response = await handler(
        new Request("http://localhost:3000/api/auth/signOut?redirect=true", {
            method: "POST",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}`,
            },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 302)
})

Deno.test("signOut without session", async () => {
    const response = await handler(
        new Request("http://localhost:3000/api/auth/signOut", {
            method: "POST",
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 202)
})

Deno.test("getSession with valid session", async () => {
    const sessionToken = await createSessionToken(sessionPayload)

    const response = await handler(
        new Request("http://localhost:3000/api/auth/session", {
            headers: { Cookie: `aura-auth.session_token=${sessionToken}` },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    console.log("Session response body:", body)
})

Deno.test("getSession without session", async () => {
    const response = await handler(new Request("http://localhost:3000/api/auth/session"))
    assertNotEquals(response, undefined)
    equal(response.status, 401)

    const body = await response.json()
    equal(body.success, false)
    equal(body.session, null)
})

Deno.test("getSession with invalid session", async () => {
    const response = await handler(
        new Request("http://localhost:3000/api/auth/session", {
            headers: { Cookie: "aura-auth.session_token=invalid_token" },
        })
    )
    equal(response.status, 401)

    const body = await response.json()
    equal(body.success, false)
    equal(body.session, null)
})

Deno.test("updateSession with valid session", async () => {
    const sessionToken = await createSessionToken(sessionPayload)
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/session", {
            method: "PATCH",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Updated Name",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    equal(body, { sucess: true, redirect: false, redirectURL: null, session: { user: sessionPayload } })
})

Deno.test("updateSession without session", async () => {
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/session", {
            method: "PATCH",
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Updated Name",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 401)
})

Deno.test("updateSession with redirect=true", async () => {
    const sessionToken = await createSessionToken(sessionPayload)
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/session?redirect=true", {
            method: "PATCH",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Updated Name",
            }),
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 302)
})

Deno.test("getCSRFToken", async () => {
    const response = await handler(new Request("http://localhost:3000/api/auth/csrfToken"))
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    assertExists(body.csrfToken)
    assertExists(body.csrfToken.length > 0)
})

Deno.test("getCSRFToken with existing token", async () => {
    const existingToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/csrfToken", {
            headers: { Cookie: `aura-auth.csrf_token=${existingToken}` },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    assertExists(body.csrfToken)
})

Deno.test("isProviderConnected with valid session", async () => {
    const sessionToken = await createSessionToken(sessionPayload)

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/github", {
            headers: { Cookie: `aura-auth.session_token=${sessionToken}` },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    assertExists(body.connected !== undefined)
})

Deno.test("isProviderConnected without session", async () => {
    const response = await handler(new Request("http://localhost:3000/api/auth/providers/github"))
    assertNotEquals(response, undefined)
    equal(response.status, 401)
})

Deno.test("isProviderConnected with invalid provider", async () => {
    const sessionToken = await createSessionToken(sessionPayload)

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/invalidprovider", {
            headers: { Cookie: `aura-auth.session_token=${sessionToken}` },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 404)
})

Deno.test("getProviderTokens with valid session", async () => {
    const sessionToken = await createSessionToken(sessionPayload)

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/github/tokens", {
            headers: { Cookie: `aura-auth.session_token=${sessionToken}` },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 200)

    const body = await response.json()
    assertExists(body.tokens !== undefined || body.error !== undefined)
})

Deno.test("getProviderTokens without session", async () => {
    const response = await handler(new Request("http://localhost:3000/api/auth/providers/github/tokens"))
    assertNotEquals(response, undefined)
    equal(response.status, 401)
})

Deno.test("revokeToken with valid session", async () => {
    const sessionToken = await createSessionToken(sessionPayload)
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/github/tokens/revoke", {
            method: "POST",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
        })
    )
    assertNotEquals(response, undefined)
    assertExists([200, 401].includes(response.status))
})

Deno.test("revokeToken without session", async () => {
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/github/tokens/revoke", {
            method: "POST",
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 401)
})

Deno.test("refreshUserInfo with valid session", async () => {
    const sessionToken = await createSessionToken(sessionPayload)
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/github/user/refresh", {
            method: "POST",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
        })
    )
    assertNotEquals(response, undefined)
    assertExists([200, 401].includes(response.status))
})

Deno.test("refreshUserInfo without session", async () => {
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/github/user/refresh", {
            method: "POST",
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 401)
})

Deno.test("disconnectProvider with valid session", async () => {
    const sessionToken = await createSessionToken(sessionPayload)
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/github", {
            method: "DELETE",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
        })
    )
    assertNotEquals(response, undefined)
    assertExists([200, 401].includes(response.status))
})

Deno.test("disconnectProvider without session", async () => {
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/github", {
            method: "DELETE",
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 401)
})

Deno.test("disconnectProvider with invalid provider", async () => {
    const sessionToken = await createSessionToken(sessionPayload)
    const csrfToken = await createCSRFToken()

    const response = await handler(
        new Request("http://localhost:3000/api/auth/providers/invalidprovider", {
            method: "DELETE",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
        })
    )
    assertNotEquals(response, undefined)
    equal(response.status, 404)
})

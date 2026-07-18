import { describe, test, expect } from "vitest"
import { createMocks, createResponse, type RequestOptions, type ResponseOptions } from "node-mocks-http"
import { auth } from "@test/pages-router/preset"
import { createCSRF } from "@aura-stack/react/crypto"
import { setResponseHeaders } from "@/pages/handler"
import type { NextApiRequest, NextApiResponse } from "next"

const createHandler = async (reqOptions?: RequestOptions, resOptions?: ResponseOptions) => {
    if (reqOptions?.body) {
        // @ts-ignore Next.js by default parses the body
        reqOptions.body = JSON.stringify(reqOptions.body)
    }
    const { req, res } = createMocks(reqOptions, resOptions)
    await auth.toHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse)
    return { req, res }
}

describe("toHandler", () => {
    test("unsupported method", async () => {
        const { res } = await createHandler({
            method: "TRACE",
        })
        expect(res.statusCode).toBe(405)
        expect(res._getJSONData()).toEqual({ error: "Method TRACE Not Allowed" })
    })

    test("GET /auth/session - http connection", async () => {
        const payload = {
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
            image: "https://example.com/john-doe.jpg",
        }

        const sessionToken = await auth.jose.encodeJWT(payload)

        const { res } = await createHandler({
            method: "GET",
            url: "/auth/session",
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}`,
                Host: "localhost:3000",
            },
        })
        expect(res.statusCode).toBe(200)
        expect(res._getJSONData()).toEqual({
            session: {
                user: payload,
                expires: expect.any(String),
            },
            success: true,
        })
    })

    test("GET /auth/session - https connection", async () => {
        const payload = {
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
            image: "https://example.com/john-doe.jpg",
        }

        const sessionToken = await auth.jose.encodeJWT(payload)

        const { res } = await createHandler({
            method: "GET",
            url: "/auth/session",
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}`,
                Host: "example.com",
                "X-Forwarded-Proto": "https",
            },
        })
        expect(res.statusCode).toBe(200)
        expect(res._getJSONData()).toEqual({
            session: {
                user: payload,
                expires: expect.any(String),
            },
            success: true,
        })
    })

    test("POST /auth/signIn/credentials", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const { res } = await createHandler({
            method: "POST",
            url: "/auth/signIn/credentials",
            headers: {
                Host: "localhost:3000",
                "X-Forwarded-Proto": "http",
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}`,
            },
            body: {
                username: "john.doe",
                password: "super-password-123",
            },
        })
        expect(res.statusCode).toBe(200)
        expect(res._getJSONData()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
    })

    test("POST /auth/signIn/credentials - invalid body", async () => {
        const { res } = await createHandler({
            method: "POST",
            url: "/auth/signIn/credentials",
            headers: {
                Host: "localhost:3000",
                "X-Forwarded-Proto": "http",
                "Content-Type": "application/json",
            },
            body: {
                name: "john.doe",
                hash: "super-password-123",
            },
        })
        expect(res.statusCode).toBe(422)
        expect(res._getJSONData()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                password: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
                username: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
            },
        })
    })

    test("PATCH /auth/session", async () => {
        const payload = {
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
            image: "https://example.com/john-doe.jpg",
        }

        const csrfToken = await createCSRF(auth.jose)
        const sessionToken = await auth.jose.encodeJWT(payload)

        const { res } = await createHandler({
            method: "PATCH",
            url: "/auth/session",
            headers: {
                Host: "localhost:3000",
                "X-Forwarded-Proto": "http",
                "Content-Type": "application/json",
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
            body: {
                user: {
                    name: "Alice",
                    image: "https://example.com/alice.jpg",
                },
            },
        })
        expect(res.statusCode).toBe(200)
        expect(res._getJSONData()).toEqual({
            success: true,
            session: {
                user: {
                    sub: "1234567890",
                    name: "Alice",
                    email: "john.doe@example.com",
                    image: "https://example.com/alice.jpg",
                },
                expires: expect.any(String),
            },
            redirect: false,
            redirectURL: null,
        })
    })

    test("POST /auth/signOut", async () => {
        const payload = {
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
            image: "https://example.com/john-doe.jpg",
        }

        const csrfToken = await createCSRF(auth.jose)
        const sessionToken = await auth.jose.encodeJWT(payload)

        const { res } = await createHandler({
            method: "POST",
            url: "/auth/signOut?token_type_hint=session_token",
            headers: {
                Host: "localhost:3000",
                "X-Forwarded-Proto": "http",
                "Content-Type": "application/json",
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            },
            body: {},
        })
        expect(res.statusCode).toBe(202)
        expect(res._getJSONData()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
    })
})

describe("setResponseHeaders", () => {
    test("sets headers on Next.js response", () => {
        const response = createResponse() as unknown as NextApiResponse
        const headers = new Headers({
            "Content-Type": "application/json",
            Cookie: "session_token=session; Path=/; HttpOnly; Secure; Domain=/",
        })
        setResponseHeaders(response, headers)
        expect(response.getHeaders()).toEqual({
            "content-type": "application/json",
            cookie: "session_token=session; Path=/; HttpOnly; Secure; Domain=/",
        })
    })

    test("overwrites existing headers", () => {
        const response = createResponse() as unknown as NextApiResponse
        response.setHeader("Content-Type", "text/plain")
        const headers = new Headers({
            "Content-Type": "application/json",
        })
        setResponseHeaders(response, headers)
        expect(response.getHeader("Content-Type")).toBe("application/json")
    })

    test("handle set-cookie headers", () => {
        const response = createResponse() as unknown as NextApiResponse
        const headers = new Headers([
            ["Set-Cookie", "session_token=session; Path=/; HttpOnly; Secure; Domain=/"],
            ["Set-Cookie", "csrf_token=csrf; Path=/; HttpOnly; Secure; Domain=/"],
            ["Set-Cookie", "__Secure-session=session; Path=/; HttpOnly; Secure; Domain=/"],
            ["Set-Cookie", "__Secure-csrf=csrf; Path=/; HttpOnly; Secure; Domain=/"],
        ])
        setResponseHeaders(response, headers)
        expect(response.getHeader("Set-Cookie")).toEqual([
            "session_token=session; Path=/; HttpOnly; Secure; Domain=/",
            "csrf_token=csrf; Path=/; HttpOnly; Secure; Domain=/",
            "__Secure-session=session; Path=/; HttpOnly; Secure; Domain=/",
            "__Secure-csrf=csrf; Path=/; HttpOnly; Secure; Domain=/",
        ])
    })
})

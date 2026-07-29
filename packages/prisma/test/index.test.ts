import { describe, test, expect } from "vitest"
import { adapter } from "@test/setup/prisma.ts"

describe("Prisma Adapter", () => {
    describe("Users", () => {
        test("createUser", async () => {
            const user = await adapter.createUser({
                name: "John Doe",
                email: "john@example.com",
                image: "https://example.com/john.jpg",
            })
            expect(user).toEqual({
                id: expect.any(String),
                name: "John Doe",
                email: "john@example.com",
                image: "https://example.com/john.jpg",
                emailVerifiedAt: null,
                status: "active",
                mfaEnabled: false,
                mfaPreferredMethod: null,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                attributes: null,
            })
        })
    })
})

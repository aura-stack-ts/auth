import { describe, expectTypeOf, test } from "vitest"
import { app, auth } from "./presets.ts"
import type { Locals } from "express"
import type { Session } from "@aura-stack/auth"
import type { EditableShape, ZodShapeToObject, UserShape } from "@aura-stack/auth/identity"

describe("Type definitions", () => {
    test("should correctly type the Express app", () => {
        app.get("/protected", auth.withAuth, (_, res) => {
            expectTypeOf(res.locals.session).toEqualTypeOf<
                Session<ZodShapeToObject<EditableShape<UserShape>>> | null | undefined
            >()
            expectTypeOf(res.locals).toEqualTypeOf<
                {
                    session?: Session<ZodShapeToObject<EditableShape<UserShape>>> | null | undefined
                } & Locals
            >()
        })
    })
})

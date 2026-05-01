import { email, string, z } from "zod/v4"
import type { EditableShape, EditableShapeValibot } from "@/@types/utility.ts"
import * as valibot from "valibot"

export type {
    InferUser,
    InferSession,
    UserFrom,
    SessionFrom,
    InferZodShape,
    ZodShapeToObject,
    EditableShape,
} from "@/@types/utility.ts"

export const UserIdentity = z.object({
    sub: string(),
    name: string().nullable().optional(),
    image: string().nullable().optional(),
    email: email().nullable().optional(),
})

export const UserIdentityValibot = valibot.object({
    sub: valibot.string(),
    name: valibot.optional(valibot.nullable(valibot.string())),
    image: valibot.optional(valibot.nullable(valibot.string())),
    email: valibot.optional(valibot.nullable(valibot.pipe(valibot.string(), valibot.email()))),
})

export type UserShape = (typeof UserIdentity)["shape"]
export type UserShapeValibot = typeof UserIdentityValibot.entries

export type Identities = EditableShape<UserShape> | EditableShapeValibot<UserShapeValibot>

export const createIdentity = <S extends EditableShape<UserShape> | EditableShapeValibot<UserShapeValibot>>(shape: S) => {
    if (typeof shape === "object" && shape !== null && Symbol.for("valibot") in shape) {
        return shape
    }
    return z.object(shape)
}

import { z } from "zod/v4"
import type { EditableShape, EditableShapeValibot } from "@/@types/utility.ts"
import * as valibot from "valibot"
import { isValibotEntries } from "./assert.ts"

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
    sub: z.string(),
    name: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
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

type ReturnShapeType<S> =
    S extends EditableShape<UserShape>
        ? z.ZodObject<S>
        : S extends EditableShapeValibot<UserShapeValibot>
          ? valibot.ObjectSchema<S, undefined>
          : never

export const createIdentity = <S extends EditableShape<UserShape> | EditableShapeValibot<UserShapeValibot>>(
    shape: S
): ReturnShapeType<S> => {
    if (isValibotEntries(shape)) {
        return valibot.object(shape) as unknown as ReturnShapeType<S>
    }
    return z.object(shape) as unknown as ReturnShapeType<S>
}

import { z } from "zod/v4"
import * as valibot from "valibot"
import { type } from "arktype"
import { isArkType, isValibotEntries, isZodEntries } from "@/shared/assert.ts"
import type { EditableShape, EditableShapeArkType, EditableShapeValibot } from "@/@types/utility.ts"

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
    email: z.email().nullable().optional(),
})

export const UserIdentityValibot = valibot.object({
    sub: valibot.string(),
    name: valibot.optional(valibot.nullable(valibot.string())),
    image: valibot.optional(valibot.nullable(valibot.string())),
    email: valibot.optional(valibot.nullable(valibot.pipe(valibot.string(), valibot.email()))),
})

export const UserIdentityArkType = type({
    sub: "string",
    name: "string | null?",
    image: "string | null?",
    email: "string.email | null?",
})

export type UserShape = typeof UserIdentity.shape
export type UserShapeValibot = typeof UserIdentityValibot.entries
export type UserShapeArkType = typeof UserIdentityArkType

export type IsArkType<T extends Identities> = T extends EditableShapeArkType<UserShapeArkType> ? true : false
export type IsZod<T extends Identities> = T extends EditableShape<UserShape> ? true : false
export type IsValibot<T extends Identities> = T extends EditableShapeValibot<UserShapeValibot> ? true : false

export type Identities =
    | EditableShape<UserShape>
    | EditableShapeValibot<UserShapeValibot>
    | EditableShapeArkType<UserShapeArkType>

type ReturnShapeType<T> =
    T extends EditableShape<UserShape>
        ? z.ZodObject<T>
        : T extends EditableShapeValibot<UserShapeValibot>
          ? valibot.ObjectSchema<T, undefined>
          : T extends EditableShapeArkType<UserShapeArkType>
            ? T
            : never

export const createIdentity = <S extends Identities>(shape: S): ReturnShapeType<S> => {
    if (isArkType(shape)) {
        return shape as unknown as ReturnShapeType<S>
    }
    if (isValibotEntries(shape)) {
        return valibot.object(shape) as unknown as ReturnShapeType<S>
    }
    if (isZodEntries(shape)) {
        return z.object(shape) as unknown as ReturnShapeType<S>
    }
    return z.object(shape) as unknown as ReturnShapeType<S>
}

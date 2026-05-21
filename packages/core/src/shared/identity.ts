import { z, type ZodObject } from "zod/v4"
import * as valibot from "valibot"
import { Type as Typebox } from "typebox"
import { type, type Type } from "arktype"
import { isArkType, isTypeboxEntries, isValibotEntries, isZodEntries } from "@/shared/assert.ts"
import type { EditableShape, EditableShapeArkType, EditableShapeTypebox, EditableShapeValibot } from "@/@types/utility.ts"

export type {
    InferUser,
    InferSession,
    UserFrom,
    SessionFrom,
    InferZodShape,
    ZodShapeToObject,
    ArktypeShapeToObject,
    TypeboxShapeToObject,
    ValibotShapeToObject,
    EditableShape,
    FromShapeToObject,
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

export const UserIdentityTypeBox = Typebox.Object({
    sub: Typebox.String(),
    name: Typebox.Optional(Typebox.Union([Typebox.String(), Typebox.Null()])),
    image: Typebox.Optional(Typebox.Union([Typebox.String(), Typebox.Null()])),
    email: Typebox.Optional(Typebox.Union([Typebox.String({ format: "email" }), Typebox.Null()])),
})

export type UserShape = typeof UserIdentity.shape
export type UserShapeValibot = typeof UserIdentityValibot.entries
export type UserShapeArkType = typeof UserIdentityArkType
export type UserShapeTypeBox = typeof UserIdentityTypeBox.properties

export type IsArkType<T extends Identities> = T extends EditableShapeArkType<UserShapeArkType> ? true : false
export type IsZod<T extends Identities> = T extends EditableShape<UserShape> ? true : false
export type IsValibot<T extends Identities> = T extends EditableShapeValibot<UserShapeValibot> ? true : false

export type SchemaTypes = ZodObject<any> | valibot.ObjectSchema<any, undefined> | Type<{}> | Typebox.TObject

export type Identities =
    | EditableShape<UserShape>
    | EditableShapeValibot<UserShapeValibot>
    | EditableShapeArkType<UserShapeArkType>
    | EditableShapeTypebox<UserShapeTypeBox>

type ReturnShapeType<T> =
    T extends EditableShape<UserShape>
        ? z.ZodObject<T>
        : T extends EditableShapeValibot<UserShapeValibot>
          ? valibot.ObjectSchema<T, undefined>
          : T extends EditableShapeArkType<UserShapeArkType>
            ? T
            : T extends EditableShapeTypebox<UserShapeTypeBox>
              ? Typebox.TObject<T>
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
    if (isTypeboxEntries(shape)) {
        return Typebox.Object(shape) as unknown as ReturnShapeType<S>
    }
    return z.object(shape) as unknown as ReturnShapeType<S>
}

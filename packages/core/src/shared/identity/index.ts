import { z, type ZodObject } from "zod/v4"
import * as valibot from "valibot"
import { type Type } from "arktype"
import { Type as Typebox } from "typebox"
import { isArkType, isTypeboxEntries, isValibotEntries, isZodEntries } from "@/shared/assert.ts"
import type { IdentityShape, IdentityShape as ZodShape } from "@/shared/identity/zod.ts"
import type { IdentityShape as ArkTypeShape } from "@/shared/identity/arktype.ts"
import type { IdentityShape as TypeboxShape } from "@/shared/identity/typebox.ts"
import type { IdentityShape as ValibotShape } from "@/shared/identity/valibot.ts"
import type {
    EditableShape,
    EditableShapeArkType,
    EditableShapeTypebox,
    EditableShapeValibot,
    EditableUser,
} from "@/@types/utility.ts"

/**
 * Re-exports the identity inference types.
 */
export type { InferSchema, ToInferSchema } from "@aura-stack/router/types"

export type { InferUser, InferSession, UserFrom, SessionFrom, EditableToSchema, FromShapeToObject } from "@/@types/utility.ts"

/**
 * @deprecated Use `IdentityShape` from `@/shared/identity/zod.ts` instead.
 */
export type UserShape = IdentityShape

export type Identities =
    | EditableShape<ZodShape>
    | EditableShapeValibot<ValibotShape>
    | EditableShapeArkType<ArkTypeShape>
    | EditableShapeTypebox<TypeboxShape>
    | EditableUser

export type SchemaTypes = ZodObject<any> | valibot.ObjectSchema<any, undefined> | Type<{}> | Typebox.TObject

type ReturnShapeType<T> =
    T extends EditableShape<ZodShape>
        ? z.ZodObject<T>
        : T extends EditableShapeValibot<ValibotShape>
          ? valibot.ObjectSchema<T, undefined>
          : T extends EditableShapeArkType<ArkTypeShape>
            ? T
            : T extends EditableShapeTypebox<TypeboxShape>
              ? Typebox.TObject<T>
              : T extends EditableUser
                ? z.ZodObject<T>
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

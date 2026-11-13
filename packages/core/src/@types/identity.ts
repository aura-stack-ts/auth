import { Type } from "arktype"
import type { TProperties, TObject, TSchema } from "typebox"
import type { ZodObject, ZodRawShape, ZodTypeAny, infer as Infer } from "zod/v4"
import type { ObjectSchema, BaseSchema, AnySchema as AnyValibotSchema, ObjectEntries, InferOutput } from "valibot"
import type { User } from "@/@types/session.ts"
import type { Merge, Wrap } from "@/@types/utility.ts"
import type { IdentityShape as ZodShape } from "@/identity/zod.ts"
import type { IdentityShape as ArkTypeShape } from "@/identity/arktype.ts"
import type { IdentityShape as TypeboxShape } from "@/identity/typebox.ts"
import type { IdentityShape as ValibotShape } from "@/identity/valibot.ts"

export type {
    /**
     * @deprecated Use `IdentityShape` from `@/shared/identity/zod.ts` instead.
     */
    ZodShape as UserShape,
}

export type SchemaTypes = ZodObject<any> | ObjectSchema<any, undefined> | Type<{}> | TObject<{}>

/**
 * Transforms a Zod raw shape so nested `ZodObject` fields become editable (same structure, for config authoring).
 */
export type EditableShape<T extends ZodRawShape> = {
    [K in keyof T]: T[K] extends ZodObject<infer Inner extends ZodRawShape> ? ZodObject<EditableShape<Inner>> : ZodTypeAny
}

export type EditableShapeZod<T extends ZodRawShape> = EditableShape<T>

export type EditableShapeValibot<T extends ObjectEntries> = {
    [K in keyof T]: T[K] extends ObjectSchema<infer Inner extends Record<string, AnyValibotSchema>, undefined>
        ? ObjectSchema<EditableShapeValibot<Inner>, undefined>
        : BaseSchema<any, any, any>
}

export type EditableShapeTypebox<T extends TProperties> = {
    [K in keyof T]: T[K] extends TObject ? Wrap<EditableShapeTypebox<T[K]["properties"]>> : TSchema
}

export type EditableUser = {
    [K in keyof User]: any
}

export type Identities =
    | EditableShape<ZodShape>
    | EditableShapeValibot<ValibotShape>
    | EditableShapeArkType<ArkTypeShape>
    | EditableShapeTypebox<TypeboxShape>
    | EditableUser

/**
 * Infers the runtime object type from a Zod `shape` and intersects it with {@link User}
 * so identity fields always include the base user contract.
 */
export type ZodShapeToObject<S extends ZodRawShape = ZodRawShape> = Merge<Infer<ZodObject<S>>, User>

export type ValibotShapeToObject<S extends ObjectEntries> = Merge<InferOutput<ObjectSchema<S, undefined>>, User>

export type ArktypeShapeToObject<S extends Type> = S extends Type<infer Shape> ? Wrap<Merge<Shape, User>> : never

export type TypeboxShapeToObject<S> = Wrap<Merge<S, User>>

export type EditableShapeArkType<T extends Type> = T extends Type<infer Shape> ? Type<{ [K in keyof Shape]: any }> : never

export type FromShapeToObject<S> = S extends ZodRawShape
    ? ZodShapeToObject<S>
    : S extends ObjectEntries
      ? ValibotShapeToObject<S>
      : S extends Type
        ? ArktypeShapeToObject<S>
        : S extends TProperties
          ? TypeboxShapeToObject<S>
          : S extends User
            ? S
            : never

export type EditableToSchema<T> =
    T extends EditableShape<infer S>
        ? ZodObject<S>
        : T extends EditableShapeValibot<infer S>
          ? ObjectSchema<S, undefined>
          : T extends EditableShapeTypebox<infer S>
            ? TObject<S>
            : T extends EditableShapeArkType<any>
              ? T
              : never

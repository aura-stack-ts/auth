import { Object, String, Optional, Union, Null } from "typebox"
import type { Identities } from "@/identity/index.ts"
import type { EditableShapeTypebox } from "@/@types/utility.ts"

export * as typebox from "typebox"

export const identitySchema = Object({
    sub: String(),
    name: Optional(Union([String(), Null()])),
    image: Optional(Union([String(), Null()])),
    email: Optional(Union([String({ format: "email" }), Null()])),
})

export type IdentityShape = typeof identitySchema.properties
export type IsTypeBox<T extends Identities> = T extends EditableShapeTypebox<IdentityShape> ? true : false

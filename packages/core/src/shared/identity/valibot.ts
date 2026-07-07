import { object, string, optional, nullable, pipe, email } from "valibot"
import type { Identities } from "@/shared/identity/index.ts"
import type { EditableShapeValibot } from "@/@types/utility.ts"

export * as valibot from "valibot"

export const identitySchema = object({
    sub: string(),
    name: optional(nullable(string())),
    image: optional(nullable(string())),
    email: optional(nullable(pipe(string(), email()))),
})

export type IdentityShape = typeof identitySchema.entries
export type IsValibot<T extends Identities> = T extends EditableShapeValibot<IdentityShape> ? true : false

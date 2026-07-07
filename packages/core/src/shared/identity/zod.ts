import { z } from "zod/v4"
import type { EditableShape } from "@/@types/utility.ts"
import type { Identities } from "@/shared/identity/index.ts"

export * as zod from "zod/v4"

export const identitySchema = z.object({
    sub: z.string(),
    name: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    email: z.email().nullable().optional(),
})

export type IdentityShape = typeof identitySchema.shape
export type IsZod<T extends Identities> = T extends EditableShape<IdentityShape> ? true : false

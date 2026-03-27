import { string, z } from "zod/v4"

export const UserIdentity = z.object({
    sub: string(),
    name: string().nullable().optional(),
    image: string().nullable().optional(),
    email: string().nullable().optional(),
})

export const StrippedUserIdentity = UserIdentity.omit({ sub: true })

export type UserIdentityType = z.infer<typeof UserIdentity>

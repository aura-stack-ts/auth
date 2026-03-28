import { string, z } from "zod/v4"
import { EditableShape } from "@/@types/utility.ts"

export const UserIdentity = z.object({
    sub: string(),
    name: string().nullable().optional(),
    image: string().nullable().optional(),
    email: string().nullable().optional(),
})

export const StrippedUserIdentity = UserIdentity.omit({ sub: true })

export type UserShape = (typeof UserIdentity)["shape"]
export type UserIdentityType = z.infer<typeof UserIdentity>

export const createIdentity = <S extends EditableShape<UserShape>>(shape: S) => z.object(shape)

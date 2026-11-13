import { Object } from "typebox"
import { object as zodObject } from "zod/v4"
import { object as valibotObject } from "valibot"
import { isArkType, isTypeboxEntries, isValibotEntries, isZodEntries } from "@/shared/assert.ts"
import type { Identities } from "@/@types/identity.ts"
import type { ReturnShapeType } from "@/@types/internal.ts"

/**
 * Re-exports the identity inference types.
 */
export type { InferSchema, ToInferSchema } from "@aura-stack/router/types"
export type { InferUser, InferSession, UserFrom, SessionFrom } from "@/@types/utility.ts"
export type { EditableToSchema, FromShapeToObject, Identities, UserShape, SchemaTypes } from "@/@types/identity.ts"

export const createIdentity = <S extends Identities>(shape: S): ReturnShapeType<S> => {
    if (isArkType(shape)) {
        return shape as unknown as ReturnShapeType<S>
    }
    if (isValibotEntries(shape)) {
        return valibotObject(shape) as unknown as ReturnShapeType<S>
    }
    if (isZodEntries(shape)) {
        return zodObject(shape) as unknown as ReturnShapeType<S>
    }
    if (isTypeboxEntries(shape)) {
        return Object(shape) as unknown as ReturnShapeType<S>
    }
    return zodObject(shape) as unknown as ReturnShapeType<S>
}

import { describe, expectTypeOf, test } from "vitest"
import type { JWTPayload, JWTVerifyOptions } from "jose"
import {
    createJWS,
    createJWT,
    decodeJWT,
    encodeJWT,
    signJWS,
    verifyJWS,
    type SecretInput,
    type DecodedJWTPayloadOptions,
    type TypedJWTPayload,
    type DerivedKeyInput,
} from "@/index.ts"

interface User extends Record<string, unknown> {
    sub: string
    name?: string
    image?: string
}

const payload: JWTPayload = {
    sub: "1234567890",
    name: "Alice",
    image: "https://example.com/avatar.png",
}

describe("type-safe payload", () => {
    test("createJWT", async () => {
        const jwt = createJWT<User>("secret")
        expectTypeOf(jwt.encodeJWT).toEqualTypeOf<
            <EncodePayload extends JWTPayload = User>(payload: TypedJWTPayload<Partial<EncodePayload>>) => Promise<string>
        >()
        expectTypeOf(jwt.decodeJWT).toEqualTypeOf<
            <DecodePayload extends JWTPayload = User>(
                token: string,
                options?: DecodedJWTPayloadOptions
            ) => Promise<TypedJWTPayload<DecodePayload>>
        >()

        const encoded = await jwt.encodeJWT({})
        expectTypeOf(encoded).toEqualTypeOf<string>()
        const decoded = await jwt.decodeJWT(encoded)
        expectTypeOf(decoded).toEqualTypeOf<TypedJWTPayload<User>>()
    })

    test("encodeJWT", async () => {
        const encoded = await encodeJWT<User>(payload, "secret")

        expectTypeOf(encoded).toEqualTypeOf<string>()
        expectTypeOf(encodeJWT<User>)
            .parameter(0)
            .toEqualTypeOf<TypedJWTPayload<Partial<User>>>()
        expectTypeOf(encodeJWT<User>)
            .parameter(1)
            .toEqualTypeOf<SecretInput | DerivedKeyInput>()
    })

    test("decodeJWT", async () => {
        const decoded = await decodeJWT<User>("token", "secret")
        expectTypeOf(decoded).toEqualTypeOf<TypedJWTPayload<User>>()
        expectTypeOf(decodeJWT<User>)
            .parameter(0)
            .toEqualTypeOf<string>()
        expectTypeOf(decodeJWT<User>)
            .parameter(1)
            .toEqualTypeOf<SecretInput | DerivedKeyInput>()
        expectTypeOf(decodeJWT<User>)
            .parameter(2)
            .toEqualTypeOf<DecodedJWTPayloadOptions | undefined>()
    })

    test("createJWS", async () => {
        const jws = createJWS<User>("secret")
        expectTypeOf(jws.signJWS).toEqualTypeOf<
            <SignPayload extends JWTPayload = User>(payload: TypedJWTPayload<Partial<SignPayload>>) => Promise<string>
        >()
        expectTypeOf(jws.verifyJWS).toEqualTypeOf<
            <VerifyPayload extends JWTPayload = User>(
                payload: string,
                options?: JWTVerifyOptions
            ) => Promise<TypedJWTPayload<VerifyPayload>>
        >()

        const signed = await jws.signJWS(payload)
        expectTypeOf(signed).toEqualTypeOf<string>()
        const verified = await jws.verifyJWS(signed)
        expectTypeOf(verified).toEqualTypeOf<TypedJWTPayload<User>>()
    })

    test("signJWS", async () => {
        const signed = await signJWS<User>(payload, "secret")
        expectTypeOf(signed).toEqualTypeOf<string>()
        expectTypeOf(signJWS<User>)
            .parameter(0)
            .toEqualTypeOf<TypedJWTPayload<Partial<User>>>()
        expectTypeOf(signJWS<User>)
            .parameter(1)
            .toEqualTypeOf<SecretInput>()
    })

    test("verifyJWS", async () => {
        const verified = await verifyJWS<User>("token", "secret")
        expectTypeOf(verified).toEqualTypeOf<TypedJWTPayload<User>>()
        expectTypeOf(verifyJWS).parameter(0).toEqualTypeOf<string>()
        expectTypeOf(verifyJWS).parameter(1).toEqualTypeOf<SecretInput>()
    })
})

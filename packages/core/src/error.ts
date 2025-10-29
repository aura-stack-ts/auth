import type { ErrorTypes, LiteralUnion } from "./@types/index.js"

export class AuraAuthError extends Error {
    public readonly type: LiteralUnion<ErrorTypes>

    constructor(type: LiteralUnion<ErrorTypes>, message: string) {
        super(message)
        this.type = type
        this.name = "AuraAuthError"
    }
}

export const throwAuraAuthError = (error: unknown, message?: string) => {
    if (error instanceof Error) {
        if (error instanceof AuraAuthError) {
            throw error
        }
        throw new AuraAuthError("invalid_request", error.message ?? message)
    }
}

export const isAuraAuthError = (error: unknown): error is AuraAuthError => {
    return error instanceof AuraAuthError
}

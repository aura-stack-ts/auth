import { internalPrismaAdapter } from "@/internal.ts"
import type { DatabaseAdapter } from "@aura-stack/auth/types"

type PrismaClientInstance<Keys extends string> = {
    [K in Keys]: Function
}

export interface PrismaAdapterOptions {
    /**
     * A Prisma Client instance configured for your database.
     * Reuse a single instance per application process.
     */
    client: PrismaClientInstance<
        | "$on"
        | "$connect"
        | "$disconnect"
        | "$executeRaw"
        | "$executeRawUnsafe"
        | "$queryRaw"
        | "$queryRawUnsafe"
        | "$transaction"
    >
    /**
     * Strategy used by `deleteUser`. Defaults to `"soft"`.
     */
    deleteStrategy?: "soft" | "hard"
}

export const prismaAdapter = (config: PrismaAdapterOptions): DatabaseAdapter => {
    return internalPrismaAdapter(config as any)
}

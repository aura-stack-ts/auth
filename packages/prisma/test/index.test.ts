import { adapter } from "@test/setup/prisma.ts"
import { createAdapterSuite } from "@aura-stack/shared/adapter"

createAdapterSuite(adapter)

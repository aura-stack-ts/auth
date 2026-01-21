
import type { RouterGlobalContext } from "./index.ts"

declare module "@aura-stack/router" {
    interface GlobalContext extends RouterGlobalContext {}
}

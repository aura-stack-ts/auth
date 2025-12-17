import type { GlobalContext } from "@aura-stack/router"
import type { RouterGlobalContext } from "./index.js"

declare module "@aura-stack/router" {
    interface GlobalContext extends RouterGlobalContext {}
}

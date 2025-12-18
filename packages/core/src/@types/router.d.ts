import type { GlobalContext } from "@aura-stack/router"
import type { RouterGlobalContext } from "./index"

declare module "@aura-stack/router" {
    interface GlobalContext extends RouterGlobalContext {}
}

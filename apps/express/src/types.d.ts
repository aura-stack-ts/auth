import { Session } from "@aura-stack/auth"

declare global {
    namespace Express {
        interface Locals {
            session?: Session
        }
    }
}

import { createSession as __createSession } from "@/session/stateless/create-session.ts"
import type { User } from "@/@types/index.ts"
import type { InternalStatelessContext, SessionStrategy } from "@/@types/internal.ts"

export const signUp = <DefaultUser extends User = User>(
    ctx: InternalStatelessContext
): SessionStrategy<DefaultUser>["signUp"] => {
    const createSession = __createSession<DefaultUser>(ctx)

    return async ({ payload, request }) => {
        return await createSession({ request, session: payload as any })
    }
}

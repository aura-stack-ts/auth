import { createSession as __createSession } from "@/session/stateless/create-session.ts"
import type { User } from "@/@types/index.ts"
import type { InternalStatelessContext, SessionStrategy } from "@/@types/internal.ts"

export const signInCredentials = <DefaultUser extends User = User>(
    ctx: InternalStatelessContext
): SessionStrategy["signInCredentials"] => {
    const createSession = __createSession<DefaultUser>(ctx)

    return async ({ payload, request }): Promise<string> => {
        return await createSession({ request, session: payload as any })
    }
}

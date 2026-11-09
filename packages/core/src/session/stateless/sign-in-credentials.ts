import { createSession as createSessionHelper } from "@/session/stateless/create-session.ts"
import type { User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const signInCredentials = <DefaultUser extends User = User>(
    ctx: InternalContextForStateless
): SessionStrategy["signInCredentials"] => {
    const createSession = createSessionHelper<DefaultUser>(ctx)

    return async ({ payload, request }): Promise<string> => {
        return await createSession({ request, session: payload as any })
    }
}

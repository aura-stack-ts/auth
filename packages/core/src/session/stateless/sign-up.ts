import { createSession as createSessionHelper } from "@/session/stateless/create-session.ts"
import type { User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const signUp = <DefaultUser extends User = User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["signUp"] => {
    const createSession = createSessionHelper<DefaultUser>(ctx)

    return async ({ payload, request }) => {
        return await createSession({ request, session: payload as any })
    }
}

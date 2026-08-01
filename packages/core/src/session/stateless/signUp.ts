import { createSession as __createSession } from "@/session/stateless/createSession.ts"
import type { InternalStatelessContext, TypedJWTPayload, User } from "@/@types/index.ts"

export const signUp = <DefaultUser extends User = User>(ctx: InternalStatelessContext) => {
    const createSession = __createSession<DefaultUser>(ctx)

    return async (payload: Record<string, unknown>, _request: Request): Promise<string> => {
        return await createSession(payload as TypedJWTPayload<DefaultUser>)
    }
}

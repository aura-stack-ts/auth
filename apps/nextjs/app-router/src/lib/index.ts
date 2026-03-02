import {
    getCSRFToken as getCSRFTokenClient,
    getSession as getSessionClient,
    signIn as signInClient,
    signOut as signOutClient,
} from "./client"
import {
    getCSRFToken as getCSRFTokenServer,
    getSession as getSessionServer,
    signIn as signInServer,
    signOut as signOutServer,
} from "./server"

export const createAuthClient = {
    getCSRFToken: getCSRFTokenClient,
    getSession: getSessionClient,
    signIn: signInClient,
    signOut: signOutClient,
}

export const createAuthServer = {
    getCSRFToken: getCSRFTokenServer,
    getSession: getSessionServer,
    signIn: signInServer,
    signOut: signOutServer,
}

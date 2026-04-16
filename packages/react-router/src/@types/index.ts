import type { Prettify, SignInAPIOptions, SignInAPIReturn, SignInCredentialsAPIReturn, SignOutAPIOptions } from "@/@types/core"

export type * from "./core"

export type ReactRouterSignInAPIOptions = Prettify<SignInAPIOptions & { request: Request }>

export type ReactRouterSignInCredentialsAPIOptions = Prettify<SignInAPIOptions & { request: Request }>

export type ReactRouterSignOutAPIOptions = Prettify<SignOutAPIOptions & { request: Request }>

export type ReactRouterSignInAPIReturn<Redirect extends boolean = true> = Redirect extends true ? Response : SignInAPIReturn

export type ReactRouterSignInCredentialsAPIReturn<Redirect extends boolean = true> = Redirect extends true
    ? Response
    : SignInCredentialsAPIReturn

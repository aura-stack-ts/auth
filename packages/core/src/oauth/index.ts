/**
 * @module OAuth Providers
 *
 * This modules re-exports OAuth providers available in Aura Auth to be used in the Auth instance configuration.
 */
import { github } from "./github.ts"
import { bitbucket } from "./bitbucket.ts"
import { figma } from "./figma.ts"
import { discord } from "./discord.ts"
import { gitlab } from "./gitlab.ts"
import { spotify } from "./spotify.ts"
import { x } from "./x.ts"
import { strava } from "./strava.ts"
import { mailchimp } from "./mailchimp.ts"
import { pinterest } from "./pinterest.ts"
import { twitch } from "./twitch.ts"
import { notion } from "./notion.ts"
import { dropbox } from "./dropbox.ts"
import { atlassian } from "./atlassian.ts"
import { clickUp } from "./click-up.ts"
import { reddit } from "./reddit.ts"

export * from "./github.ts"
export * from "./bitbucket.ts"
export * from "./figma.ts"
export * from "./discord.ts"
export * from "./gitlab.ts"
export * from "./spotify.ts"
export * from "./x.ts"
export * from "./strava.ts"
export * from "./mailchimp.ts"
export * from "./pinterest.ts"
export * from "./twitch.ts"
export * from "./notion.ts"
export * from "./dropbox.ts"
export * from "./atlassian.ts"
export * from "./click-up.ts"
export * from "./reddit.ts"
export * from "./coinbase.ts"

export const builtInOAuthProviders = {
    github,
    bitbucket,
    figma,
    discord,
    gitlab,
    spotify,
    x,
    strava,
    mailchimp,
    pinterest,
    twitch,
    notion,
    dropbox,
    atlassian,
    clickUp,
    reddit,
} as const

export type BuiltInOAuthProvider = keyof typeof builtInOAuthProviders

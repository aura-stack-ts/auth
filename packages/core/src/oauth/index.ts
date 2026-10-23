/**
 * @module OAuth Providers
 *
 * This modules re-exports OAuth providers available in Aura Auth to be used in the Auth instance configuration.
 */
import { atlassian } from "./atlassian.ts"
import { authentik } from "./authentik.ts"
import { bitbucket } from "./bitbucket.ts"
import { clickUp } from "./click-up.ts"
import { coinbase } from "./coinbase.ts"
import { discord } from "./discord.ts"
import { dribbble } from "./dribbble.ts"
import { dropbox } from "./dropbox.ts"
import { figma } from "./figma.ts"
import { github } from "./github.ts"
import { gitlab } from "./gitlab.ts"
import { google } from "./google.ts"
import { hubspot } from "./hubspot.ts"
import { huggingface } from "./huggingface.ts"
import { mailchimp } from "./mailchimp.ts"
import { notion } from "./notion.ts"
import { pinterest } from "./pinterest.ts"
import { reddit } from "./reddit.ts"
import { spotify } from "./spotify.ts"
import { strava } from "./strava.ts"
import { tiktok } from "./tiktok.ts"
import { twitch } from "./twitch.ts"
import { x } from "./x.ts"

export * from "./atlassian.ts"
export * from "./authentik.ts"
export * from "./bitbucket.ts"
export * from "./click-up.ts"
export * from "./coinbase.ts"
export * from "./discord.ts"
export * from "./dribbble.ts"
export * from "./dropbox.ts"
export * from "./figma.ts"
export * from "./github.ts"
export * from "./gitlab.ts"
export * from "./google.ts"
export * from "./hubspot.ts"
export * from "./huggingface.ts"
export * from "./mailchimp.ts"
export * from "./notion.ts"
export * from "./pinterest.ts"
export * from "./reddit.ts"
export * from "./spotify.ts"
export * from "./strava.ts"
export * from "./tiktok.ts"
export * from "./twitch.ts"
export * from "./x.ts"

export const builtInOAuthProviders = {
    atlassian,
    authentik,
    bitbucket,
    clickUp,
    coinbase,
    discord,
    dribbble,
    dropbox,
    figma,
    github,
    gitlab,
    google,
    hubspot,
    huggingface,
    mailchimp,
    notion,
    pinterest,
    reddit,
    spotify,
    strava,
    tiktok,
    twitch,
    x,
} as const

export type BuiltInOAuthProvider = keyof typeof builtInOAuthProviders

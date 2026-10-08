/**
 * @module OAuth Providers
 *
 * This modules re-exports OAuth providers available in Aura Auth to be used in the Auth instance configuration.
 */
import { github } from "@/oauth/github.ts"
import { bitbucket } from "@/oauth/bitbucket.ts"
import { figma } from "@/oauth/figma.ts"
import { discord } from "@/oauth/discord.ts"
import { gitlab } from "@/oauth/gitlab.ts"
import { spotify } from "@/oauth/spotify.ts"
import { x } from "@/oauth/x.ts"
import { strava } from "@/oauth/strava.ts"
import { mailchimp } from "@/oauth/mailchimp.ts"
import { pinterest } from "@/oauth/pinterest.ts"
import { twitch } from "@/oauth/twitch.ts"
import { notion } from "@/oauth/notion.ts"
import { dropbox } from "@/oauth/dropbox.ts"
import { atlassian } from "@/oauth/atlassian.ts"
import { clickUp } from "@/oauth/click-up.ts"
import { dribbble } from "@/oauth/dribbble.ts"
import { hubspot } from "@/oauth/hubspot.ts"
import { google } from "@/oauth/google.ts"
import { huggingface } from "@/oauth/huggingface.ts"
import { authentik } from "@/oauth/authentik.ts"

export * from "@/oauth/github.ts"
export * from "@/oauth/bitbucket.ts"
export * from "@/oauth/figma.ts"
export * from "@/oauth/discord.ts"
export * from "@/oauth/gitlab.ts"
export * from "@/oauth/spotify.ts"
export * from "@/oauth/x.ts"
export * from "@/oauth/strava.ts"
export * from "@/oauth/mailchimp.ts"
export * from "@/oauth/pinterest.ts"
export * from "@/oauth/twitch.ts"
export * from "@/oauth/notion.ts"
export * from "@/oauth/dropbox.ts"
export * from "@/oauth/atlassian.ts"
export * from "@/oauth/click-up.ts"
export * from "@/oauth/dribbble.ts"
export * from "@/oauth/hubspot.ts"
export * from "@/oauth/google.ts"
export * from "@/oauth/huggingface.ts"
export * from "@/oauth/authentik.ts"

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
    dribbble,
    hubspot,
    google,
    huggingface,
    authentik,
} as const

export type BuiltInOAuthProvider = keyof typeof builtInOAuthProviders

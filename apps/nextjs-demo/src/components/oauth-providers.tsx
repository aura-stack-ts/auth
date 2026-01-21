"use client"
import { useState } from "react"
import type { OAuthProvidersProps } from "@/@types/props"

export const OAuthProviders = ({ providers, isAuthenticated }: OAuthProvidersProps) => {
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

    const handleProviderClick = (providerId: string) => {
        if (selectedProvider === providerId) {
            setSelectedProvider(null)
        } else {
            setSelectedProvider(providerId)
        }
    }

    return (
        <ul className="space-y-3">
            {providers.map((provider) => (
                <li
                    key={provider.id}
                    className="border border-solid border-zinc-200 rounded-lg overflow-hidden dark:border-zinc-800"
                >
                    <button
                        className={`w-full p-4 flex items-center justify-between cursor-pointer transition-colors text-left ${
                            selectedProvider === provider.id
                                ? "bg-zinc-100 dark:bg-zinc-800"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        }`}
                        onClick={() => handleProviderClick(provider.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{provider.name}</span>
                                    {provider.configured ? (
                                        <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                            ✓ Ready
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                                            Not Configured
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Sign in with your {provider.name} account
                                </p>
                            </div>
                        </div>
                        <svg
                            className={`w-5 h-5 transition-transform ${selectedProvider === provider.id ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {selectedProvider === provider.id && (
                        <div className="px-4 pb-4 pt-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 space-y-3 dark:border-zinc-800">
                            <div>
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Redirect URI:</p>
                                <p className="bg-white dark:bg-zinc-800 rounded p-2 text-xs font-mono">{provider.redirectURI}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                    Environment Variables:
                                </p>
                                <div className="bg-white dark:bg-zinc-800 rounded p-2 text-xs font-mono space-y-1">
                                    <p className="flex items-center gap-2">
                                        <span className="text-zinc-500">AURA_AUTH_{provider.id.toUpperCase()}_CLIENT_ID</span>
                                        {provider.clientIdInput && <span className="text-green-500">✓</span>}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-zinc-500">AURA_AUTH_{provider.id.toUpperCase()}_CLIENT_SECRET</span>
                                        {provider.clientSecretInput && <span className="text-green-500">✓</span>}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Endpoints:</p>
                                <ul className="bg-white dark:bg-zinc-800 rounded p-2 text-xs font-mono space-y-1">
                                    <li className="text-zinc-500">{provider.authorizeURL}</li>
                                    <li className="text-zinc-500">{provider.accessToken}</li>
                                    <li className="text-zinc-500">{provider.userInfo}</li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">OAuth Scopes:</p>
                                <p className="flex flex-wrap gap-1">
                                    {provider.scopes.map((scope) => (
                                        <span
                                            key={scope}
                                            className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded"
                                        >
                                            {scope}
                                        </span>
                                    ))}
                                </p>
                            </div>
                            {provider.configured && !isAuthenticated && (
                                <form action={`auth/signIn/${provider.id}`} method="GET" className="mt-3">
                                    <input type="hidden" name="redirectTo" value="/" />
                                    <button className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium transition-colors flex items-center justify-center gap-2">
                                        SignIn with {provider.name}
                                    </button>
                                </form>
                            )}
                            {!provider.configured && (
                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                                    <p className="text-yellow-800 dark:text-yellow-300">
                                        Configure this provider by adding the required environment variables to your .env file.
                                    </p>
                                </div>
                            )}

                            {isAuthenticated && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                    <p className="text-blue-800 dark:text-blue-300">
                                        You're already signed in. Sign out first to test another provider.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </li>
            ))}

            {providers.filter((p) => p.configured).length === 0 && (
                <div className="p-6 text-center border border-dashed border-zinc-300 rounded-lg dark:border-zinc-700">
                    <p className="text-zinc-600 text-sm dark:text-zinc-400">
                        No OAuth providers configured. Add environment variables to enable authentication.
                    </p>
                </div>
            )}
        </ul>
    )
}

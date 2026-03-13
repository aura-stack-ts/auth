"use client"

import { useAuthClient } from "@/contexts/auth"
import { LayoutDashboard } from "lucide-react"
import { Button } from "./ui/button"

export const AuthClient = () => {
    const { session, isAuthenticated, isLoading, signIn, signOut } = useAuthClient()

    return (
        <div className="w-full p-6 pr-3 bg-black md:py-10">
            <div className="w-full p-6 relative space-y-6 border border-muted border-dashed">
                <span className="px-2 text-xs font-mono italic absolute -top-2 left-3 bg-green-600">Client Component</span>
                {isAuthenticated ? (
                    <>
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="py-3 px-2 border border-muted rounded-md space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono italic">client session active</span>
                                    <LayoutDashboard className="size-4 text-foreground" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="size-14 rounded-full bg-linear-to-b from-white to-white/40 p-px">
                                        <div className="h-full w-full rounded-full aspect-square bg-black flex items-center justify-center text-xl font-bold">
                                            {session?.user?.name?.[0] || "?"}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-white">{session?.user?.name}</p>
                                        <p className="text-xs text-white/40 font-mono">{session?.user?.email}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-muted">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-white/20 uppercase">ID</span>
                                        <span className="text-white/60 truncate max-w-37.5">{session?.user?.sub}</span>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={() => signOut()}>
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4 text-center">
                            <h2 className="text-2xl font-semibold text-white">Sign in to continue</h2>
                            <p className="text-sm text-white/40">
                                Choose a provider below to authenticate and start your session.
                            </p>
                            <div className="flex flex-col gap-y-2">
                                {["Github", "Gitlab", "Bitbucket"].map((provider) => (
                                    <div className="w-full" key={provider}>
                                        <Button
                                            type="button"
                                            className="w-full rounded-none"
                                            variant="outline"
                                            size="sm"
                                            disabled={isLoading}
                                            onClick={() => signIn(provider.toLowerCase())}
                                        >
                                            Sign In with {provider}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

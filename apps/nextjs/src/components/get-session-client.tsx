"use client"

import { useAuthClient } from "@/contexts/auth"
import { LayoutDashboard } from "lucide-react"

export const SessionClient = () => {
    const { session } = useAuthClient()

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="py-3 px-2 border border-muted rounded-md space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono italic">client session active</span>
                    <LayoutDashboard className="size-4 text-foreground" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-full bg-linear-to-b from-white to-white/40 p-px">
                        <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-xl font-bold">
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
            </div>
        </div>
    )
}

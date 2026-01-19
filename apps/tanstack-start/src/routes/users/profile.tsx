import { createFileRoute } from "@tanstack/react-router"
import { Server, Smartphone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const Route = createFileRoute("/users/profile")({
    component: RouteComponent,
})

function RouteComponent() {
    const user = {
        name: "Hernan",
        email: "hernan@example.com",
        image: "",
        sub: "user_123456789",
        role: "admin",
    }

    return (
        <div className="pt-22 pb-6 min-h-screen bg-black">
            <main className="w-11/12 max-w-5xl mx-auto container space-y-8">
                <div className="grid gap-8 md:grid-cols-[300px_1fr]">
                    <aside className="space-y-6">
                        <Card className="overflow-hidden border-muted shadow-md bg-[#121212]">
                            <CardContent className="p-6 relative">
                                <figure className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shadow-lg overflow-hidden">
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{user.name.charAt(0)}</span>
                                    )}
                                </figure>
                                <div className="mt-6 space-y-1">
                                    <h2 className="text-2xl font-bold">{user.name}</h2>
                                    <p className="text-muted-foreground text-sm">{user.email}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-muted shadow-sm bg-[#121212]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Account Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-medium">Active Session</span>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-muted shadow-sm hover:border-primary/20 transition-colors bg-[#121212]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Server-Side Session</CardTitle>
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Authenticated</div>
                                    <p className="text-xs text-muted-foreground mt-1">Verified via secure HTTP-only cookies</p>
                                </CardContent>
                            </Card>
                            <Card className="border-muted shadow-sm hover:border-primary/20 transition-colors bg-[#121212]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Client-Side State</CardTitle>
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Synced</div>
                                    <p className="text-xs text-muted-foreground mt-1">React hooks managing local state</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="border-muted shadow-md bg-[#121212]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="w-5 h-5 text-[#6366f1]" />
                                    Server Loader Data
                                </CardTitle>
                                <CardDescription>
                                    Session data retrieved directly from the server loader function.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border border-muted">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-50">Property</TableHead>
                                                <TableHead>Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                    user.sub
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{user.sub}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                    user.name
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{user.name}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                    user.email
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{user.email}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                    user.image
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground italic">
                                                    {user.image || "No image provided"}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-muted shadow-md bg-[#121212]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-[#a855f7]" />
                                    Client Loader Data
                                </CardTitle>
                                <CardDescription>Session data available to the client-side via React hooks.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-50">Property</TableHead>
                                                <TableHead>Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                    user.sub
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{user.sub}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                    user.name
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{user.name}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                    user.email
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{user.email}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                    user.image
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground italic">
                                                    {user.image || "No image provided"}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

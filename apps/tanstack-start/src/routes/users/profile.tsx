import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Server, Smartphone, Shield, Home } from "lucide-react"

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
        <div className="min-h-screen bg-muted/20 pb-20">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="p-1 rounded bg-primary/10 text-primary">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span>Aura Auth</span>
                        </Link>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Link>
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-8 py-8 space-y-8">
                <Breadcrumb className="bg-background/50 px-4 py-2 rounded-lg border w-fit backdrop-blur-sm">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/">Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink>Users</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-semibold text-primary">Profile</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="grid gap-8 md:grid-cols-[300px_1fr]">
                    <aside className="space-y-6">
                        <Card className="overflow-hidden border-muted shadow-md">
                            <div className="h-32 bg-gradient-to-r from-blue-500 to-violet-500 opacity-90"></div>
                            <CardContent className="pt-0 relative">
                                <div className="absolute -top-12 left-6">
                                    <div className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shadow-lg overflow-hidden">
                                        {user.image ? (
                                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{user.name.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-14 space-y-1">
                                    <h2 className="text-2xl font-bold">{user.name}</h2>
                                    <p className="text-muted-foreground text-sm">{user.email}</p>
                                    <div className="pt-2">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 uppercase tracking-wider">
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-muted shadow-sm">
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
                            <Card className="border-muted shadow-sm hover:border-primary/20 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Server-Side Session</CardTitle>
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Authenticated</div>
                                    <p className="text-xs text-muted-foreground mt-1">Verified via secure HTTP-only cookies</p>
                                </CardContent>
                            </Card>
                            <Card className="border-muted shadow-sm hover:border-primary/20 transition-colors">
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

                        <Card className="border-muted shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="w-5 h-5 text-blue-500" />
                                    Server Loader Data
                                </CardTitle>
                                <CardDescription>
                                    Session data retrieved directly from the server loader function.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[200px]">Property</TableHead>
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

                        <Card className="border-muted shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-violet-500" />
                                    Client Loader Data
                                </CardTitle>
                                <CardDescription>Session data available to the client-side via React hooks.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[200px]">Property</TableHead>
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

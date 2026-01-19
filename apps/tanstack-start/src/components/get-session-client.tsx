import { useEffect } from "react"
import { useRouter } from "@tanstack/react-router"
import { Smartphone } from "lucide-react"
import { useSession } from "@/contexts/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const GetSessionClient = () => {
    const { session, isAuthenticated, isLoading } = useSession()
    const router = useRouter()
    const user = session?.user!

    useEffect(() => {
        if (isLoading) return
        if (!isAuthenticated) {
            router.navigate({ to: "/signIn" })
        }
    }, [isAuthenticated, router])

    return (
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
                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">user.sub</TableCell>
                                <TableCell className="w-full max-w-0 font-mono text-xs truncate">{user?.sub}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">user.name</TableCell>
                                <TableCell className="w-full max-w-0 font-mono text-xs truncate">{user?.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">user.email</TableCell>
                                <TableCell className="w-full max-w-0 font-mono text-xs truncate">
                                    {user?.email ?? "No email provided"}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium font-mono text-xs text-muted-foreground">user.image</TableCell>
                                <TableCell className="w-full max-w-0 font-mono text-xs truncate">
                                    {user?.image ?? "No image provided"}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

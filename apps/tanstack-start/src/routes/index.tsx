import { createFileRoute } from "@tanstack/react-router"

export const IndexPage = () => {
    return <div>Welcome to the TanStack Start App!</div>
}

export const Route = createFileRoute("/")({ component: IndexPage })
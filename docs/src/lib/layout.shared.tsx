import { GithubInfo } from "fumadocs-ui/components/github-info"
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

export function baseOptions(): BaseLayoutProps {
    return {
        nav: {
            title: "Aura Auth",
        },
        githubUrl: "https://github.com/aura-stack-ts/auth",
        links: [
            {
                type: "custom",
                children: <GithubInfo owner="aura-stack-ts" repo="auth" className="lg:-mx-2" />,
            },
        ],
    }
}

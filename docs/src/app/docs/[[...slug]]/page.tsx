import { getPageImage, source } from "@/lib/source"
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page"
import { notFound } from "next/navigation"
import { getMDXComponents } from "@/mdx-components"
import type { Metadata } from "next"
import { createRelativeLink } from "fumadocs-ui/mdx"
import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions"

export default async function Page(props: Readonly<PageProps<"/docs/[[...slug]]">>) {
    const params = await props.params
    const page = source.getPage(params.slug)
    if (!page) notFound()

    const Mdx = page.data.body

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <div className="flex flex-col gap-y-2 lg:flex-row lg:items-center lg:justify-between">
                <DocsTitle>{page.data.title}</DocsTitle>
                <div className="flex flex-row gap-2 items-center">
                    <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
                    <ViewOptions
                        markdownUrl={`${page.url}.mdx`}
                        githubUrl={`https://github.com/aura-stack-ts/auth/blob/master/docs/src/content/docs/${page.path}`}
                    />
                </div>
            </div>
            <DocsDescription className="pb-6 border-b">{page.data.description}</DocsDescription>
            <DocsBody>
                <Mdx
                    components={getMDXComponents({
                        a: createRelativeLink(source, page),
                    })}
                />
            </DocsBody>
        </DocsPage>
    )
}

export async function generateStaticParams() {
    return source.generateParams()
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
    const params = await props.params
    const page = source.getPage(params.slug)
    if (!page) notFound()

    return {
        title: page.data.title,
        description: page.data.description,
        openGraph: {
            images: getPageImage(page).url,
        },
    }
}

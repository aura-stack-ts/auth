import { remarkAutoTypeTable, createGenerator } from "fumadocs-typescript"
import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config"
import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins"

// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
    dir: "src/content/docs",
    docs: {
        schema: frontmatterSchema,
        postprocess: {
            includeProcessedMarkdown: true,
        },
    },
    meta: {
        schema: metaSchema,
    },
})

const generator = createGenerator()

export default defineConfig({
    mdxOptions: {
        remarkPlugins: [[remarkAutoTypeTable, { generator }], remarkMdxMermaid],
    },
})

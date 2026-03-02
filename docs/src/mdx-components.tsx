import type { MDXComponents } from "mdx/types"
import defaultMdxComponents from "fumadocs-ui/mdx"
import { createGenerator } from "fumadocs-typescript"
import { AutoTypeTable } from "fumadocs-typescript/ui"
import * as TabsComponents from "fumadocs-ui/components/tabs"
import * as StepComponents from "fumadocs-ui/components/steps"
import { Mermaid } from "@/components/mdx/mermaid"

const generator = createGenerator()

export function getMDXComponents(components?: MDXComponents): MDXComponents {
    return {
        ...defaultMdxComponents,
        AutoTypeTable: (props) => <AutoTypeTable {...props} generator={generator} />,
        Mermaid,
        ...TabsComponents,
        ...StepComponents,
        ...components,
    }
}

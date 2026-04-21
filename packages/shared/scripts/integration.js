import { existsSync } from "node:fs"
import { parseArgs } from "node:util"
import { cp } from "node:fs/promises"
import { basename, resolve } from "node:path"

const args = parseArgs({
    args: process.argv.slice(2),
    strict: true,
    options: {
        name: {
            type: "string",
        },
    },
})

const { name } = args.values

if (!name) {
    console.error("\x1b[31m[error]: Integration name is required\x1b[0m")
    process.exit(1)
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    console.error("\x1b[31m[error]: Integration name must be lowercase alphanumeric with dashes\x1b[0m")
    process.exit(1)
}

if (existsSync(resolve(process.cwd(), "packages", name))) {
    console.error("\x1b[31m[error]: Integration with the same name already exists\x1b[0m")
    process.exit(1)
}

try {
    const outDir = resolve(process.cwd(), "packages", name)
    const templateDir = resolve(process.cwd(), "packages", "integration")

    if (!existsSync(templateDir)) {
        console.error("\x1b[31m[error]: Integration template folder not found at packages/integration\x1b[0m")
        process.exit(1)
    }

    console.log(`\x1b[34m[info]: Creating integration "${name}"...\x1b[0m`)
    await cp(templateDir, outDir, {
        recursive: true,
        filter: (src) => {
            const name = basename(src)
            return name !== "node_modules" && name !== "dist"
        },
    })

    console.log("\x1b[32m[success]: Integration created successfully\x1b[0m")
} catch (error) {
    console.error("\x1b[31m[error]: Failed to create integration:\x1b[0m", error)
    process.exit(1)
}

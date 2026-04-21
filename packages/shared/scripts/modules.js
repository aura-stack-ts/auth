import { glob, mkdir, readFile, writeFile } from "node:fs/promises"
import { join, parse, resolve } from "node:path"
import { parseArgs } from "node:util"

const coreModules = ["crypto", "identity", "shared"]
const jsonExports = [
    {
        name: "./oauth",
        entry: "/index",
        out: "/oauth",
    },
    {
        name: "./oauth/*",
        entry: "/*",
        out: "/oauth",
    },
    {
        name: "./identity",
        entry: "/identity",
        out: "/_core",
    },
    {
        name: "./crypto",
        entry: "/crypto",
        out: "/_core",
    },
    {
        name: "./shared",
        entry: "/shared",
        out: "/_core",
    },
]

const args = parseArgs({
    args: process.argv.slice(2),
    strict: false,
    options: {
        out: {
            type: "string",
            default: "src",
        },
        from: {
            type: "string",
            default: "core",
        },
        core: {
            type: "boolean",
            default: true,
        },
        json: {
            type: "boolean",
            default: true,
        },
    },
})

const { out, from, core, json } = args.values

const resolvePackageName = (from) => {
    return from === "core" ? "auth" : from
}

try {
    const outDir = resolve(process.cwd(), join(out, "oauth"))
    console.log("From:", resolve(process.cwd(), join("..", from)), "\nOut:", resolve(process.cwd(), out))
    await mkdir(outDir, { recursive: true })
    for await (const file of glob(`../core/src/oauth/*.ts`)) {
        const oauthName = parse(file).name
        const outPath = resolve(outDir, `${oauthName}.ts`)
        await writeFile(outPath, `export * from "@aura-stack/${resolvePackageName(from)}/oauth/${oauthName}"\n`, "utf-8")
    }
    console.log("\x1b[32mOAuth modules were exported successfully!\x1b[0m")

    if (core === true) {
        const outDirCore = resolve(process.cwd(), join(out, "_core"))
        await mkdir(outDirCore, { recursive: true })
        for (const moduleName of coreModules) {
            const outPathCore = resolve(outDirCore, `${moduleName}.ts`)
            await writeFile(outPathCore, `export * from "@aura-stack/${resolvePackageName(from)}/${moduleName}"\n`, "utf-8")
        }
        console.log("\x1b[32mCore modules were exported successfully!\x1b[0m")
    }

    if (json === true) {
        const packageJson = await readFile(resolve(process.cwd(), "package.json"), "utf-8")
        const readJson = JSON.parse(packageJson)
        if (!readJson?.exports) {
            readJson.exports = {}
        }
        for (const { name, entry, out } of jsonExports) {
            if (!readJson.exports[name]) {
                Object.assign(readJson.exports, {
                    [name]: {
                        types: `./dist${out}${entry}.d.ts`,
                        import: `./dist${out}${entry}.js`,
                        require: `./dist${out}${entry}.cjs`,
                    },
                })
            }
        }
        await writeFile(resolve(process.cwd(), "package.json"), JSON.stringify(readJson, null, 2), "utf-8")
        console.log("\x1b[32mPackage.json exports were updated successfully!\x1b[0m")
    }
} catch (error) {
    console.error("\x1b[31m[error]: Failed to export modules:\x1b[0m", error)
    process.exit(1)
}

import { parseArgs } from "node:util"
import { join, parse, resolve } from "node:path"
import { glob, mkdir, readFile, writeFile } from "node:fs/promises"

const jsonExports = [
    {
        name: "./oauth",
        entry: "/index",
        out: "/generated/oauth",
    },
    {
        name: "./oauth/*",
        entry: "/*",
        out: "/generated/oauth",
    },
    {
        name: "./identity",
        entry: "/index",
        out: "/generated/identity",
    },
    {
        name: "./identity/*",
        entry: "/*",
        out: "/generated/identity",
    },
    {
        name: "./crypto",
        entry: "/crypto",
        out: "/generated/exports",
    },
    {
        name: "./shared",
        entry: "/shared",
        out: "/generated/exports",
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
        json: {
            type: "boolean",
            default: true,
        },
    },
})

const { out, from, json } = args.values

const resolvePackageName = (from) => {
    return from === "core" ? "auth" : from
}

const copyFolder = async (dirName, silentEntry = false) => {
    const outDir = resolve(process.cwd(), join(out, "generated", dirName))
    console.log("From:", resolve(process.cwd(), join("..", from)), " - Out:", resolve(process.cwd(), out), "\x1b[32m✓\x1b[0m")
    await mkdir(outDir, { recursive: true })
    for await (const file of glob(`../core/src/${dirName}/*.ts`)) {
        const oauthName = parse(file).name
        const outPath = resolve(outDir, `${oauthName}.ts`)
        await writeFile(
            outPath,
            `export * from "@aura-stack/${resolvePackageName(from)}/${silentEntry ? "" : `${dirName}/`}${oauthName}"\n`,
            "utf-8"
        )
    }
    console.log(`\x1b[32m${dirName}/ modules were exported successfully!\x1b[0m`)
}

try {
    await copyFolder("oauth")
    await copyFolder("identity")
    await copyFolder("exports", true)

    if (json === true) {
        const packageJson = await readFile(resolve(process.cwd(), "package.json"), "utf-8")
        const readJson = JSON.parse(packageJson)
        if (!readJson?.exports) {
            readJson.exports = {}
        }
        for (const { name, entry, out } of jsonExports) {
            Object.assign(readJson.exports, {
                [name]: {
                    types: `./dist${out}${entry}.d.ts`,
                    import: `./dist${out}${entry}.js`,
                    require: `./dist${out}${entry}.cjs`,
                },
            })
        }
        await writeFile(resolve(process.cwd(), "package.json"), JSON.stringify(readJson, null, 2), "utf-8")
        console.log("\x1b[32mPackage.json exports were updated successfully!\x1b[0m")
    }
} catch (error) {
    console.error("\x1b[31m[error]: Failed to export modules:\x1b[0m", error)
    process.exit(1)
}

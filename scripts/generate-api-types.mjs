// Regenerates src/types/api.d.ts from the backend's OpenAPI spec.
//
// Assumes GenWrite-Backend is checked out as a sibling directory (override with
// BACKEND_DIR if yours lives elsewhere). Requires the backend's deps to already
// be installed, since it runs the backend's own spec-generation script.
import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const frontendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const backendDir = path.resolve(
  frontendRoot,
  process.env.BACKEND_DIR || "../GenWrite-Backend"
)
const specPath = path.join(backendDir, "openapi.json")
// Named apiSchema (not api.d.ts) to avoid colliding with the hand-written src/types/api.ts —
// TS module resolution picks the .ts file over a same-named .d.ts, silently hiding this one.
const outPath = path.join(frontendRoot, "src/types/apiSchema.d.ts")

if (!existsSync(backendDir)) {
  console.error(
    `Backend not found at ${backendDir}. Set BACKEND_DIR to point at your GenWrite-Backend checkout.`
  )
  process.exit(1)
}

console.log(`Generating OpenAPI spec in ${backendDir}...`)
execFileSync("node", ["scripts/generate-openapi-json.mjs"], {
  cwd: backendDir,
  stdio: "inherit",
})

console.log(`Generating ${path.relative(frontendRoot, outPath)} from ${specPath}...`)
execFileSync("npx", ["openapi-typescript", specPath, "-o", outPath], {
  cwd: frontendRoot,
  stdio: "inherit",
})

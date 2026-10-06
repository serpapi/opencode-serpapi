import { tool, type Plugin } from "@opencode-ai/plugin"
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parse as parseYaml } from "yaml"
import type { Context as V2Context, Plugin as V2Plugin } from "@opencode/plugin/promise/plugin"
import type { Skill as V2Skill } from "@opencode/plugin/promise/index"
import { queryParamFor } from "./engines"

const SERPAPI_MCP_URL = "https://mcp.serpapi.com/mcp"
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))

type SearchParams = Record<string, string>
type SearchArguments = {
  engine?: string
  q?: string
  params?: Record<string, string | number | boolean>
}

const SERPAPI_PLUGIN_ID = "opencode-serpapi"
const SERPAPI_SKILL_PATH = join(CURRENT_DIR, "skills", "serpapi-web-search", "SKILL.md")

function parseSkill(source: string) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  if (!frontmatter) throw new Error(`Missing YAML frontmatter in ${SERPAPI_SKILL_PATH}`)

  const value: unknown = parseYaml(frontmatter[1])
  const metadata = typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

  return {
    name: typeof metadata.name === "string" ? metadata.name : "serpapi-web-search",
    description: typeof metadata.description === "string"
      ? metadata.description
      : "SerpApi search-engine routing, credentials, and response guidance.",
    content: source.slice(frontmatter[0].length).trim(),
  }
}

async function executeSearch(args: SearchArguments, signal: AbortSignal): Promise<string> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) return "SERPAPI_API_KEY is not available to the OpenCode process."

  const engine = args.engine?.trim() || "google_light"
  const queryParam = queryParamFor(engine)
  const requestParams: Record<string, string> = {
    engine,
    ...(args.params ? Object.fromEntries(Object.entries(args.params).map(([key, value]) => [key, String(value)])) : {}),
  }
  if (args.q && !requestParams[queryParam]) requestParams[queryParam] = args.q
  delete requestParams.api_key

  try {
    return await searchWithRestApi(requestParams, apiKey, signal)
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).replaceAll(apiKey, "[REDACTED]")
    return `SerpApi search failed: ${message}`
  }
}

async function searchWithRestApi(
  params: SearchParams,
  apiKey: string,
  signal: AbortSignal,
): Promise<string> {
  const url = new URL("https://serpapi.com/search.json")
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  url.searchParams.set("api_key", apiKey)

  const response = await fetch(url, { signal })
  const output = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${output}`)
  return output
}

export const SerpApiPlugin: Plugin = async () => {
  return {
    tool: {
      serpapi_search: tool({
        description:
          "Search the web and supported search engines through the SerpApi HTTPS API.",
        args: {
          engine: tool.schema.string().optional().describe("SerpApi engine id; defaults to google_light."),
          q: tool.schema.string().optional().describe("Search query."),
          params: tool.schema
            .record(tool.schema.string(), tool.schema.union([tool.schema.string(), tool.schema.number(), tool.schema.boolean()]))
            .optional()
            .describe("Additional engine-specific SerpApi parameters."),
        },
        async execute(args, context) {
          return executeSearch(args, context.abort)
        },
      }),
    },
    async config(input) {
      input.mcp ??= {}
      const apiKey = process.env.SERPAPI_API_KEY
      input.mcp.serpapi ??= {
        type: "remote",
        url: SERPAPI_MCP_URL,
        oauth: false,
        ...(apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {}),
      }

      // OpenCode's published Plugin type may lag its runtime skill support.
      // @ts-expect-error skills is supported at runtime but may be absent from older types
      input.skills ??= {}
      // @ts-expect-error skills is supported at runtime but may be absent from older types
      input.skills.paths ??= []
      // @ts-expect-error skills is supported at runtime but may be absent from older types
      input.skills.paths.push(join(CURRENT_DIR, "skills"))
    },
  }
}

export const SerpApiV2Plugin: V2Plugin = {
  id: SERPAPI_PLUGIN_ID,
  async setup(context) {
    const skill = parseSkill(await readFile(SERPAPI_SKILL_PATH, "utf8"))

    await context.mcp.transform((editor) => {
      if (!editor.get("serpapi")) {
        editor.set("serpapi", {
          type: "remote",
          url: SERPAPI_MCP_URL,
          oauth: false,
          ...(process.env.SERPAPI_API_KEY
            ? { headers: { Authorization: `Bearer ${process.env.SERPAPI_API_KEY}` } }
            : {}),
        })
      }
    })

    await context.tool.transform((editor) => {
      editor.add({
        name: "serpapi_search",
        description: "Search the web and supported search engines through the SerpApi HTTPS API.",
        input: {
          type: "object",
          properties: {
            engine: { type: "string", description: "SerpApi engine id; defaults to google_light." },
            q: { type: "string", description: "Search query." },
            params: {
              type: "object",
              additionalProperties: {
                anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
              },
              description: "Additional engine-specific SerpApi parameters.",
            },
          },
          additionalProperties: false,
        },
        async execute(input, toolContext) {
          return { content: await executeSearch(input as SearchArguments, toolContext.signal) }
        },
      })
    })

    await context.skill.transform((editor) => {
      editor.add({
        id: "serpapi-web-search" as V2Skill.ID,
        name: skill.name as V2Skill.Name,
        description: skill.description,
        path: SERPAPI_SKILL_PATH as V2Context["location"]["directory"],
        content: skill.content,
      })
    })
  },
}

export default {
  ...SerpApiV2Plugin,
  server: SerpApiPlugin,
}

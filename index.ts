import { tool, type Plugin } from "@opencode-ai/plugin"
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parse as parseYaml } from "yaml"
import type { Context as V2Context, Plugin as V2Plugin } from "@opencode/plugin/promise/plugin"
import type { Skill as V2Skill } from "@opencode/plugin/promise/index"
import { DEFAULT_ENGINE, FEATURED_ENGINES, queryParamFor } from "./engines"

const SERPAPI_MCP_URL = "https://mcp.serpapi.com/mcp"
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))

const SEARCH_TOOL_DESCRIPTION = [
  "Search the web and supported search engines through the SerpApi HTTPS API.",
  "Set `engine` to pick a search engine. Featured engines:",
  ...FEATURED_ENGINES.map(([id, label]) => `- ${id}: ${label}`),
  "Other SerpApi engine ids also work. Load the serpapi-web-search skill for engine-specific parameters.",
].join("\n")
const ENGINE_ARG_DESCRIPTION = `SerpApi engine id; defaults to ${DEFAULT_ENGINE}.`

const EXTRACT_MODES = ["scrape", "map", "crawl"] as const
const EXTRACT_OUTPUTS = ["md", "json"] as const
// Crawl bills one credit per page; keep the default below the API's 10.
const DEFAULT_CRAWL_MAX_PAGES = 5
const EXTRACT_TOOL_DESCRIPTION = [
  "Read a web page through the SerpApi Extract API. Returns the page's main content as Markdown by default.",
  "Modes: `scrape` (default) extracts one page; `map` lists the site's URLs from links and sitemaps;",
  `\`crawl\` follows same-site links and extracts each page, costing one search credit per page (max_pages defaults to ${DEFAULT_CRAWL_MAX_PAGES}).`,
  "Follows robots.txt and does not run JavaScript.",
].join("\n")
const EXTRACT_ARG_DESCRIPTIONS = {
  url: "Absolute http or https URL of the page to extract.",
  mode: "scrape (default), map, or crawl.",
  output: "md (default) for Markdown or json for structured page data.",
  max_pages: `crawl only: maximum pages to extract, 1-100; defaults to ${DEFAULT_CRAWL_MAX_PAGES}.`,
  max_depth: "crawl only: link depth to follow, 0-3; defaults to 2.",
  include_subdomains: "map/crawl only: include other subdomains of the same site.",
  include_tags: "Comma-separated CSS selectors to keep, e.g. `article, main`.",
  exclude_tags: "Comma-separated CSS selectors to remove, e.g. `nav, footer`.",
}

type SearchParams = Record<string, string>
type SearchArguments = {
  engine?: string
  q?: string
  params?: Record<string, string | number | boolean>
}
type ExtractArguments = {
  url: string
  mode?: typeof EXTRACT_MODES[number]
  output?: typeof EXTRACT_OUTPUTS[number]
  max_pages?: number
  max_depth?: number
  include_subdomains?: boolean
  include_tags?: string
  exclude_tags?: string
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
  const engine = args.engine?.trim() || DEFAULT_ENGINE
  const queryParam = queryParamFor(engine)
  const requestParams: Record<string, string> = {
    engine,
    ...(args.params ? Object.fromEntries(Object.entries(args.params).map(([key, value]) => [key, String(value)])) : {}),
  }
  if (args.q && !requestParams[queryParam]) requestParams[queryParam] = args.q

  return runRestRequest(requestParams, signal, "json", "search")
}

async function executeExtract(args: ExtractArguments, signal: AbortSignal): Promise<string> {
  let target: URL
  try {
    target = new URL(args.url)
  } catch {
    return "SerpApi extract failed: url must be an absolute http or https URL."
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return "SerpApi extract failed: url must be an absolute http or https URL."
  }

  const mode = args.mode ?? "scrape"
  const requestParams: Record<string, string> = { engine: "extract", url: target.href, mode }
  if (mode === "crawl") {
    requestParams.max_pages = String(args.max_pages ?? DEFAULT_CRAWL_MAX_PAGES)
    if (args.max_depth !== undefined) requestParams.max_depth = String(args.max_depth)
  }
  if (mode !== "scrape" && args.include_subdomains !== undefined) {
    requestParams.include_subdomains = String(args.include_subdomains)
  }
  if (args.include_tags) requestParams.include_tags = args.include_tags
  if (args.exclude_tags) requestParams.exclude_tags = args.exclude_tags

  return runRestRequest(requestParams, signal, args.output ?? "md", "extract")
}

async function runRestRequest(
  params: SearchParams,
  signal: AbortSignal,
  format: "json" | "md",
  label: string,
): Promise<string> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) return "SERPAPI_API_KEY is not available to the OpenCode process."
  delete params.api_key

  try {
    return await searchWithRestApi(params, apiKey, signal, format)
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).replaceAll(apiKey, "[REDACTED]")
    return `SerpApi ${label} failed: ${message}`
  }
}

async function searchWithRestApi(
  params: SearchParams,
  apiKey: string,
  signal: AbortSignal,
  format: "json" | "md" = "json",
): Promise<string> {
  const url = new URL(`https://serpapi.com/search.${format}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  url.searchParams.set("api_key", apiKey)

  const response = await fetch(url, { signal })
  const output = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${output}`)
  return output
}

async function executeWebSearch(query: string, signal: AbortSignal) {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) throw new Error("SERPAPI_API_KEY is not available to the OpenCode process.")

  try {
    const output = await searchWithRestApi({ engine: DEFAULT_ENGINE, q: query }, apiKey, signal)
    const response: unknown = JSON.parse(output)
    if (typeof response !== "object" || response === null || !("organic_results" in response)) return []

    const results = response.organic_results
    if (!Array.isArray(results)) return []

    return results.flatMap((result) => {
      if (typeof result !== "object" || result === null || !("link" in result) || typeof result.link !== "string") {
        return []
      }

      return [{
        url: result.link,
        ...("title" in result && typeof result.title === "string" ? { title: result.title } : {}),
        ...("snippet" in result && typeof result.snippet === "string" ? { content: result.snippet } : {}),
        time: {},
      }]
    })
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).replaceAll(apiKey, "[REDACTED]")
    throw new Error(`SerpApi web search failed: ${message}`)
  }
}

export const SerpApiPlugin: Plugin = async () => {
  return {
    tool: {
      serpapi_search: tool({
        description: SEARCH_TOOL_DESCRIPTION,
        args: {
          engine: tool.schema.string().optional().describe(ENGINE_ARG_DESCRIPTION),
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
      serpapi_extract: tool({
        description: EXTRACT_TOOL_DESCRIPTION,
        args: {
          url: tool.schema.string().describe(EXTRACT_ARG_DESCRIPTIONS.url),
          mode: tool.schema.enum(EXTRACT_MODES).optional().describe(EXTRACT_ARG_DESCRIPTIONS.mode),
          output: tool.schema.enum(EXTRACT_OUTPUTS).optional().describe(EXTRACT_ARG_DESCRIPTIONS.output),
          max_pages: tool.schema.number().int().min(1).max(100).optional().describe(EXTRACT_ARG_DESCRIPTIONS.max_pages),
          max_depth: tool.schema.number().int().min(0).max(3).optional().describe(EXTRACT_ARG_DESCRIPTIONS.max_depth),
          include_subdomains: tool.schema.boolean().optional().describe(EXTRACT_ARG_DESCRIPTIONS.include_subdomains),
          include_tags: tool.schema.string().optional().describe(EXTRACT_ARG_DESCRIPTIONS.include_tags),
          exclude_tags: tool.schema.string().optional().describe(EXTRACT_ARG_DESCRIPTIONS.exclude_tags),
        },
        async execute(args, context) {
          return executeExtract(args, context.abort)
        },
      }),
    },
    async config(input) {
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
        name: "serpapi_rest_search",
        description: SEARCH_TOOL_DESCRIPTION,
        input: {
          type: "object",
          properties: {
            engine: { type: "string", description: ENGINE_ARG_DESCRIPTION },
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
      editor.add({
        name: "serpapi_rest_extract",
        description: EXTRACT_TOOL_DESCRIPTION,
        input: {
          type: "object",
          properties: {
            url: { type: "string", description: EXTRACT_ARG_DESCRIPTIONS.url },
            mode: { type: "string", enum: [...EXTRACT_MODES], description: EXTRACT_ARG_DESCRIPTIONS.mode },
            output: { type: "string", enum: [...EXTRACT_OUTPUTS], description: EXTRACT_ARG_DESCRIPTIONS.output },
            max_pages: { type: "integer", minimum: 1, maximum: 100, description: EXTRACT_ARG_DESCRIPTIONS.max_pages },
            max_depth: { type: "integer", minimum: 0, maximum: 3, description: EXTRACT_ARG_DESCRIPTIONS.max_depth },
            include_subdomains: { type: "boolean", description: EXTRACT_ARG_DESCRIPTIONS.include_subdomains },
            include_tags: { type: "string", description: EXTRACT_ARG_DESCRIPTIONS.include_tags },
            exclude_tags: { type: "string", description: EXTRACT_ARG_DESCRIPTIONS.exclude_tags },
          },
          required: ["url"],
          additionalProperties: false,
        },
        async execute(input, toolContext) {
          return { content: await executeExtract(input as ExtractArguments, toolContext.signal) }
        },
      })
    })

    await context.websearch.transform((editor) => {
      editor.add({
        id: "serpapi",
        name: "SerpApi",
        async execute({ query }, toolContext) {
          return executeWebSearch(query, toolContext.signal)
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

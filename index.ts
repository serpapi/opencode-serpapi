import { tool, type Plugin } from "@opencode-ai/plugin"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { queryParamFor } from "./engines"

const SERPAPI_MCP_URL = "https://mcp.serpapi.com/mcp"
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))

type SearchParams = Record<string, string>

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
          const apiKey = process.env.SERPAPI_API_KEY
          if (!apiKey) {
            return "SERPAPI_API_KEY is not available to the OpenCode process."
          }

          const engine = args.engine?.trim() || "google_light"
          const queryParam = queryParamFor(engine)
          const requestParams: Record<string, string> = {
            engine,
            ...(args.params ? Object.fromEntries(Object.entries(args.params).map(([key, value]) => [key, String(value)])) : {}),
          }
          if (args.q && !requestParams[queryParam]) requestParams[queryParam] = args.q
          delete requestParams.api_key

          try {
            return await searchWithRestApi(requestParams, apiKey, context.abort)
          } catch (error) {
            const message = (error instanceof Error ? error.message : String(error)).replaceAll(apiKey, "[REDACTED]")
            return `SerpApi search failed: ${message}`
          }
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

export default SerpApiPlugin

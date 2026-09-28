import { tool, type Plugin, type PluginInput } from "@opencode-ai/plugin"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { queryParamFor } from "./engines"

const SERPAPI_MCP_URL = "https://mcp.serpapi.com/mcp"
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))

type SearchParams = Record<string, string>
type PluginShell = PluginInput["$"]

async function searchWithSerpApiCli(
  shell: PluginShell,
  params: SearchParams,
): Promise<{ exitCode: number; output: string }> {
  const cliArguments = Object.entries(params)
    .map(([key, value]) => `${shell.escape(`${key}=${value}`)}`)
    .join(" ")
  const command = `command -v serpapi >/dev/null 2>&1 && serpapi search ${cliArguments}`
  const result = await shell`sh -c ${command}`.quiet()
  return { exitCode: result.exitCode, output: result.text() }
}

async function searchWithRestApi(
  shell: PluginShell,
  params: SearchParams,
): Promise<{ exitCode: number; output: string }> {
  const curlArguments = Object.entries(params)
    .map(([key, value]) => `--data-urlencode ${shell.escape(`${key}=${value}`)}`)
    .join(" ")
  const command = `curl --fail-with-body --silent --show-error --get "https://serpapi.com/search.json" ${curlArguments} --data-urlencode "api_key=$SERPAPI_API_KEY"`
  const result = await shell`sh -c ${command}`.quiet()
  return { exitCode: result.exitCode, output: result.text() }
}

export const SerpApiPlugin: Plugin = async ({ $ }) => {
  return {
    tool: {
      serpapi_search: tool({
        description:
          "Search the web and supported search engines through SerpApi. Automatically uses the official serpapi CLI when installed, then HTTPS cURL.",
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

          const shell = $.cwd(context.directory).env({ SERPAPI_API_KEY: apiKey }).nothrow()
          const cliResult = await searchWithSerpApiCli(shell, requestParams)
          if (cliResult.exitCode === 0) return cliResult.output

          const restResult = await searchWithRestApi(shell, requestParams)
          if (restResult.exitCode === 0) return restResult.output

          return `SerpApi search failed (CLI exit ${cliResult.exitCode}, REST exit ${restResult.exitCode}): ${restResult.output}`
        },
      }),
    },
    async config(input) {
      input.mcp ??= {}
      input.mcp.serpapi ??= {
        type: "remote",
        url: SERPAPI_MCP_URL,
        oauth: false,
        headers: {
          Authorization: "Bearer {env:SERPAPI_API_KEY}",
        },
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

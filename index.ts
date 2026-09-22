import { type Plugin, tool } from "@opencode-ai/plugin"
import { DEFAULT_ENGINE, FEATURED_ENGINES, queryParamFor } from "./engines"

const SEARCH_ENDPOINT = "https://serpapi.com/search.json"

const FEATURED_TABLE = FEATURED_ENGINES.map(([id, label]) => `- \`${id}\` — ${label}`).join("\n")

const SEARCH_DESCRIPTION = `Search the web via SerpApi. One tool covers Google, Bing, Amazon, Walmart, eBay, YouTube, Google Maps, Google Scholar, Google News, Google Flights, and 100+ other search engines — pick the right \`engine\` for the user's intent.

Each call costs one SerpApi search credit (cached results are free). Confirm with the user first if the query or engine choice is ambiguous, or if you are about to issue several calls for a comparison.

Frequently used engines:
${FEATURED_TABLE}

Full engine list: https://serpapi.com/search-engine-apis

Defaults to \`google_light\` (fast, cheap) for plain web search. Use \`google\` only when you need knowledge graph, ads, or other advanced SERP features. Pass engine-specific parameters (e.g. Google Flights' departure_id/arrival_id, Amazon's category filters) via \`params\`.`

export const SerpApiPlugin: Plugin = async () => {
  return {
    tool: {
      search: tool({
        description: SEARCH_DESCRIPTION,
        args: {
          engine: tool.schema
            .string()
            .optional()
            .describe(
              `SerpApi engine id, e.g. "google_light" (default), "google", "bing", "amazon", "walmart", "ebay", "google_maps", "google_scholar", "google_news", "youtube", "google_flights". See https://serpapi.com/search-engine-apis for the full list.`,
            ),
          q: tool.schema
            .string()
            .optional()
            .describe(
              "The search query / what to look for. Automatically mapped to the correct parameter name for the chosen engine (q, k, query, _nkw, find_desc, etc.) — just pass plain text here.",
            ),
          location: tool.schema
            .string()
            .optional()
            .describe('Where the search should originate from, city-level recommended, e.g. "Austin, Texas, United States".'),
          gl: tool.schema.string().optional().describe('Country code, e.g. "us", "uk", "fr".'),
          hl: tool.schema.string().optional().describe('Language code, e.g. "en", "es", "de".'),
          device: tool.schema
            .enum(["desktop", "tablet", "mobile"])
            .optional()
            .describe('Device to simulate. Defaults to "desktop".'),
          num: tool.schema.number().optional().describe("Number of results to return, where supported by the engine."),
          page: tool.schema
            .number()
            .optional()
            .describe("Page number for pagination (Amazon, Walmart, and similar engines use 1-indexed pages)."),
          start: tool.schema
            .number()
            .optional()
            .describe("Result offset for pagination (Google-family engines use 0, 10, 20, ...)."),
          no_cache: tool.schema
            .boolean()
            .optional()
            .describe("Set true to force a fresh (non-cached) search. Costs a credit even if the query was cached; default false."),
          json_restrictor: tool.schema
            .string()
            .optional()
            .describe('Restrict the response to specific fields to reduce payload size, e.g. "organic_results.title,organic_results.link".'),
          params: tool.schema
            .record(tool.schema.string(), tool.schema.union([tool.schema.string(), tool.schema.number(), tool.schema.boolean()]))
            .optional()
            .describe(
              "Additional engine-specific parameters as key-value pairs (e.g. { category_id: \"aps\" } for Amazon, { departure_id: \"JFK\", arrival_id: \"LAX\" } for Google Flights). Passed straight through to SerpApi.",
            ),
        },
        async execute(args) {
          const apiKey = process.env.SERPAPI_API_KEY
          if (!apiKey) {
            return [
              "SERPAPI_API_KEY is not set.",
              "",
              'Set it with: export SERPAPI_API_KEY="your_key_here"',
              "Get a free key (250 searches/month, no credit card) at https://serpapi.com/manage-api-key",
            ].join("\n")
          }

          const engine = args.engine?.trim() || DEFAULT_ENGINE
          const queryParam = queryParamFor(engine)

          const searchParams = new URLSearchParams()
          searchParams.set("engine", engine)
          searchParams.set("api_key", apiKey)

          if (args.q) searchParams.set(queryParam, args.q)
          if (args.location) searchParams.set("location", args.location)
          if (args.gl) searchParams.set("gl", args.gl)
          if (args.hl) searchParams.set("hl", args.hl)
          if (args.device) searchParams.set("device", args.device)
          if (args.num !== undefined) searchParams.set("num", String(args.num))
          if (args.page !== undefined) searchParams.set("page", String(args.page))
          if (args.start !== undefined) searchParams.set("start", String(args.start))
          if (args.no_cache !== undefined) searchParams.set("no_cache", String(args.no_cache))
          if (args.json_restrictor) searchParams.set("json_restrictor", args.json_restrictor)

          if (args.params) {
            for (const [key, value] of Object.entries(args.params)) {
              searchParams.set(key, String(value))
            }
          }

          const url = `${SEARCH_ENDPOINT}?${searchParams.toString()}`

          let response: Response
          try {
            response = await fetch(url)
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            return `SerpApi request failed: ${message}`
          }

          let data: any
          try {
            data = await response.json()
          } catch {
            return `SerpApi returned a non-JSON response (HTTP ${response.status}).`
          }

          if (!response.ok || data.error) {
            const reason = data.error ?? `HTTP ${response.status}`
            return `SerpApi error: ${reason}`
          }

          // search_metadata is request bookkeeping (ids, timings, cached URLs) —
          // useful for debugging, pure noise for the model. Drop it to keep the
          // result focused on actual search content.
          delete data.search_metadata

          return JSON.stringify(data, null, 2)
        },
      }),
    },
  }
}

export default SerpApiPlugin

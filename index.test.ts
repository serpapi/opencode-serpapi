import { afterEach, describe, expect, it, vi } from "vitest"
import { SerpApiPlugin } from "./index"

const originalApiKey = process.env.SERPAPI_API_KEY

async function pluginHooks() {
  return SerpApiPlugin({} as never)
}

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalApiKey === undefined) delete process.env.SERPAPI_API_KEY
  else process.env.SERPAPI_API_KEY = originalApiKey
})

describe("serpapi_search", () => {
  it("calls the REST API with mapped parameters and the trusted API key", async () => {
    process.env.SERPAPI_API_KEY = "trusted-key"
    const fetchMock = vi.fn(async (_input: string | URL | Request) => new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const search = (await pluginHooks()).tool?.serpapi_search
    if (!search) throw new Error("serpapi_search was not registered")

    const result = await search.execute(
      { engine: "amazon", q: "headphones", params: { api_key: "untrusted-key", page: 2 } },
      {} as never,
    )

    expect(result).toBe('{"ok":true}')
    expect(fetchMock).toHaveBeenCalledOnce()
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe("https://serpapi.com/search.json")
    expect(Object.fromEntries(url.searchParams)).toEqual({
      engine: "amazon",
      page: "2",
      k: "headphones",
      api_key: "trusted-key",
    })
  })

  it("returns HTTP failures as tool output", async () => {
    process.env.SERPAPI_API_KEY = "test-key"
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limited", { status: 429 })))
    const search = (await pluginHooks()).tool?.serpapi_search
    if (!search) throw new Error("serpapi_search was not registered")

    await expect(search.execute({ engine: "google_light", q: "news" }, {} as never)).resolves.toBe(
      "SerpApi search failed: HTTP 429: rate limited",
    )
  })

  it("does not make a request without an API key", async () => {
    delete process.env.SERPAPI_API_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const search = (await pluginHooks()).tool?.serpapi_search
    if (!search) throw new Error("serpapi_search was not registered")

    await expect(search.execute({ q: "news" }, {} as never)).resolves.toBe(
      "SERPAPI_API_KEY is not available to the OpenCode process.",
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("MCP configuration", () => {
  it("resolves the API key into the authorization header", async () => {
    process.env.SERPAPI_API_KEY = "test-key"
    const hooks = await pluginHooks()
    const config = {}

    await hooks.config?.(config)

    expect(config).toMatchObject({
      mcp: {
        serpapi: {
          type: "remote",
          url: "https://mcp.serpapi.com/mcp",
          oauth: false,
          headers: { Authorization: "Bearer test-key" },
        },
      },
    })
  })
})
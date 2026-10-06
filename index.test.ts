import { afterEach, describe, expect, it, vi } from "vitest"
import DefaultPlugin, { SerpApiPlugin, SerpApiV2Plugin } from "./index"
import type { Context as V2Context } from "@opencode/plugin/promise/plugin"

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

describe("dual-version entrypoint", () => {
  it("keeps the V1 server implementation on the default export", async () => {
    expect(typeof DefaultPlugin.server).toBe("function")
    const hooks = await DefaultPlugin.server({} as never)
    expect(hooks.tool?.serpapi_search).toBeDefined()
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

describe("OpenCode V2 adapter", () => {
  it("registers the native search tool, remote MCP server, and bundled skill", async () => {
    const tools: Array<{ name: string; execute: (input: unknown, context: { signal: AbortSignal }) => Promise<{ content: string }> }> = []
    const servers: Record<string, unknown> = {}
    const skills: Array<{ id: string; name: string; description?: string; content: string }> = []
    const context = {
      mcp: {
        transform: async (transform: (editor: { get: (name: string) => unknown; set: (name: string, config: unknown) => void }) => void) =>
          transform({
            get: (name) => servers[name],
            set: (name, config) => { servers[name] = config },
          }),
      },
      tool: {
        transform: async (transform: (editor: { add: (definition: typeof tools[number]) => void }) => void) =>
          transform({ add: (definition) => tools.push(definition) }),
      },
      skill: {
        transform: async (transform: (editor: { add: (skill: typeof skills[number]) => void }) => void) =>
          transform({ add: (skill) => skills.push(skill) }),
      },
    } as unknown as V2Context

    process.env.SERPAPI_API_KEY = "v2-test-key"
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    await SerpApiV2Plugin.setup(context)

    expect(tools.map(({ name }) => name)).toContain("serpapi_search")
    expect(servers.serpapi).toMatchObject({
      type: "remote",
      url: "https://mcp.serpapi.com/mcp",
      oauth: false,
      headers: { Authorization: "Bearer v2-test-key" },
    })
    expect(skills).toHaveLength(1)
    expect(skills[0].name).toBe("serpapi-web-search")
    expect(skills[0].description).toContain("SerpApi provides live web and structured search results")
    expect(skills[0].content).toMatch(/^# SerpApi web search/)
    expect(skills[0].content).not.toContain("description: |")
    await expect(tools[0].execute({ engine: "amazon", q: "headphones" }, { signal: new AbortController().signal }))
      .resolves.toEqual({ content: '{"ok":true}' })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
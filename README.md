# <img src="https://user-images.githubusercontent.com/307597/154772945-1b7dba5f-21cf-41d0-bb2e-65b6eff4aaaf.png" width="30" height="30"/> SerpApi Plugin for OpenCode

An [OpenCode plugin](https://opencode.ai/docs/plugins) that connects your agent to SerpApi's hosted MCP server for Google, Amazon, Walmart, eBay, YouTube, Google Maps, Google Scholar, and [100+ other engines](https://serpapi.com/search-engine-apis).

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Quick Start

### 1. Get an API key

Sign up at [serpapi.com](https://serpapi.com/users/sign_up?plan=free) and set the key:

> **Free tier** – 250 searches/month, no credit card required.

```bash
export SERPAPI_API_KEY="your_serpapi_key"
```

### 2. Install the plugin

Add the npm package name to the `plugin` list in `opencode.json`. OpenCode
automatically installs npm plugins at startup:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["serpapi-opencode"]
}
```

After the package is published to npm, restart OpenCode (or start a new
session). The plugin registers SerpApi as a remote MCP server automatically.

### 3. Use it

Ask in natural language and the agent picks the tool and engine on its own:

> *Search Google for the best Python web frameworks*
>
> *Compare prices for AirPods Pro on Amazon, Walmart, and eBay*
>
> *Find academic papers about transformer architectures published after 2020*
>
> *Find well-reviewed coffee shops near Times Square*

## How it works

This is an **OpenCode MCP integration**. The plugin adds the hosted SerpApi MCP server at `https://mcp.serpapi.com/mcp` and configures bearer-header authentication from `SERPAPI_API_KEY`. It also registers a local OpenCode skill with engine-selection and search guidance. OpenCode exposes the MCP search tool to the model. If MCP is unavailable, the plugin's native `serpapi_search` tool calls the SerpApi HTTPS API directly.

## Features

- **MCP-native search** — OpenCode receives the `search` tool from the `serpapi` MCP server.
- **All SerpApi engines** — the MCP server supports Google, Bing, Amazon, Walmart, eBay, YouTube, Google Maps, Google Scholar, and other engines.
- **MCP header authentication** — the key is read from `SERPAPI_API_KEY` and sent in the MCP `Authorization` header, not embedded in the MCP URL or source code.
- **Structured results** — the MCP server supports JSON, compact responses, Markdown output, and engine-specific parameter validation.
- **Local search guidance** — the bundled skill helps the model choose engines and use engine-specific parameters without owning credentials or making API requests.
- **Portable fallback** — `serpapi_search` uses the runtime's built-in `fetch`, with no CLI, shell, or cURL dependency.

## Supported Engines

| Category | Engines |
|----------|---------|
| Web Search | Google, Google Light, Bing, DuckDuckGo, Yahoo, Yandex, Baidu, Naver |
| AI Search | Google AI Mode, Google AI Overview, Bing Copilot, Brave AI Mode |
| Shopping | Amazon, Walmart, eBay, Google Shopping, Home Depot |
| Local / Maps | Google Maps, Google Local, Yelp, TripAdvisor, OpenTable |
| Research | Google Scholar, Google Patents, Google Trends |
| News | Google News |
| Media | Google Images, Google Videos, YouTube, Google Lens |
| Travel | Google Flights, Google Hotels, Google Travel Explore |
| Jobs | Google Jobs |
| Finance | Google Finance |
| Apps | Google Play, Apple App Store |

See the full, current list at [serpapi.com/search-engine-apis](https://serpapi.com/search-engine-apis). Detailed engine, MCP, CLI, cURL, credential, and response guidance is bundled under `skills/serpapi-web-search/references/`.

## Troubleshooting

- **"Tool not showing up"** — confirm `serpapi-opencode` is listed under `plugin` in `opencode.json`, confirm `SERPAPI_API_KEY` is available to OpenCode, and restart OpenCode.

If MCP is unavailable, ask the agent to use `serpapi_search`. Confirm that
`SERPAPI_API_KEY` is available to the OpenCode process.

## Development

```bash
npm install
npx tsc --noEmit   # type-check
```

The plugin configures the `serpapi` MCP server, whose primary tool is `search`, and also exposes `serpapi_search` as a native HTTPS route. The bundled skill provides routing and operational guidance; the reference files contain detailed engine and route documentation. `engines.ts` supplies query-field mapping for native requests.

## Related

- [SerpApi MCP Server](https://github.com/serpapi/serpapi-mcp) — for Claude Desktop, VS Code, and Cursor
- [SerpApi Docs](https://serpapi.com/search-api) — full API reference
- [SerpApi Playground](https://serpapi.com/playground) — interactive API explorer
- [OpenCode Plugin Docs](https://opencode.ai/docs/plugins)

## License

MIT License — see [LICENSE](LICENSE) file for details.

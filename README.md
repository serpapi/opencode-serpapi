# <img src="https://user-images.githubusercontent.com/307597/154772945-1b7dba5f-21cf-41d0-bb2e-65b6eff4aaaf.png" width="30" height="30"/> SerpApi Plugin for OpenCode

An [OpenCode plugin](https://opencode.ai/docs/plugins) that connects your agent to SerpApi's hosted MCP server for Google, Amazon, Walmart, eBay, YouTube, Google Maps, Google Scholar, and [100+ other engines](https://serpapi.com/search-engine-apis).

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Quick Start

### 1. Get an API key

Sign up at [serpapi.com](https://serpapi.com/users/sign_up?plan=free) and set the key:

> **Free tier** – 250 searches/month, no credit card required.

```bash
export SERPAPI_API_KEY="your_key_here"
```

### 2. Install the plugin

Add the npm package name to the `plugin` list in `opencode.json`. OpenCode
automatically installs npm plugins at startup:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-serpapi"]
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

This is an **OpenCode MCP integration**. The plugin adds the hosted SerpApi MCP server at `https://mcp.serpapi.com/mcp` and configures bearer-header authentication from `SERPAPI_API_KEY`. It also registers a local OpenCode skill with engine-selection and search guidance, following the same separation used by the SerpApi Codex plugin. OpenCode exposes the MCP search tool to the model. The plugin does not call the SerpApi REST API directly and does not place the API key in a request URL.

## Features

- **MCP-native search** — OpenCode receives the `search` tool from the `serpapi` MCP server.
- **All SerpApi engines** — the MCP server supports Google, Bing, Amazon, Walmart, eBay, YouTube, Google Maps, Google Scholar, and other engines.
- **Secure header authentication** — the key is expanded from `SERPAPI_KEY` into an `Authorization` header; it is not embedded in the MCP URL or source code.
- **Structured results** — the MCP server supports JSON, compact responses, Markdown output, and engine-specific parameter validation.
- **Local search guidance** — the bundled skill helps the model choose engines and use engine-specific parameters without owning credentials or making API requests.
- **Fallback routes** — when MCP is unavailable, the skill guides the agent to use the official SerpApi CLI, then HTTPS cURL as a last resort.
- **CLI/REST search tool** — `serpapi_search` tries the official CLI and then cURL when the MCP server is unavailable.

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

- **"Missing API key"** — export `SERPAPI_KEY` before starting OpenCode, or configure it in the environment used to launch OpenCode.
- **"Invalid API key"** — verify at [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key).
- **Rate limit exceeded** — wait, or [upgrade your plan](https://serpapi.com/pricing).
- **Tool not showing up** — confirm `opencode-serpapi` is listed under `plugin` in `opencode.json`, confirm `SERPAPI_KEY` is available to OpenCode, and restart OpenCode.

If MCP is unavailable, install and authenticate the official CLI:

```bash
brew tap serpapi/homebrew-tap
brew install serpapi-cli
serpapi login
```

The CLI fallback prefers `SERPAPI_KEY` or its secure config file. Do not pass the
key with `--api-key`, because command-line arguments can be visible in process listings.

## Development

```bash
npm install
npx tsc --noEmit   # type-check
```

The plugin configures the `serpapi` MCP server, whose primary tool is `search`, and also exposes `serpapi_search` as a native CLI/cURL route. The bundled skill provides routing and operational guidance; the reference files contain detailed engine and route documentation. `engines.ts` supplies query-field mapping for native requests.

## Related

- [SerpApi Claude Code Plugin](https://github.com/serpapi/serpapi-claude-plugin)
- [SerpApi Codex Plugin](https://github.com/serpapi/serpapi-codex-plugin)
- [SerpApi MCP Server](https://github.com/serpapi/serpapi-mcp) — for Claude Desktop, VS Code, and Cursor
- [SerpApi Docs](https://serpapi.com/search-api) — full API reference
- [SerpApi Playground](https://serpapi.com/playground) — interactive API explorer
- [OpenCode Plugin Docs](https://opencode.ai/docs/plugins)

## License

MIT License — see [LICENSE](LICENSE) file for details.

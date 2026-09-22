# <img src="https://user-images.githubusercontent.com/307597/154772945-1b7dba5f-21cf-41d0-bb2e-65b6eff4aaaf.png" width="30" height="30"/> SerpApi Plugin for OpenCode

An [OpenCode plugin](https://opencode.ai/docs/plugins) that gives your agent a native `search` tool covering Google, Amazon, Walmart, eBay, YouTube, Google Maps, Google Scholar, and [100+ other engines](https://serpapi.com/search-engine-apis) via the [SerpApi](https://serpapi.com) REST API.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Quick Start

### 1. Get an API key

Sign up at [serpapi.com](https://serpapi.com/users/sign_up?plan=free) and set the key:

> **Free tier** – 250 searches/month, no credit card required.

```bash
export SERPAPI_API_KEY="your_key_here"
```

### 2. Install the plugin

Add it to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-serpapi"]
}
```

Restart OpenCode (or start a new session) — the `search` tool is registered automatically, no MCP block or slash command needed.

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

This is a **native OpenCode tool**, not a skill or an MCP wrapper: the plugin registers one `search` tool (per [opencode's Custom Tools API](https://opencode.ai/docs/plugins#custom-tools)) whose `execute` function calls SerpApi's REST API (`https://serpapi.com/search.json`) directly with `fetch`. The model never has to hand-build a `curl` command or remember which query-parameter name each engine expects — the plugin does that mapping in code (`engines.ts`), the same engine-selection table used by [`serpapi-claude-plugin`](https://github.com/serpapi/serpapi-claude-plugin) and [`serpapi-codex-plugin`](https://github.com/serpapi/serpapi-codex-plugin), ported to TypeScript.

## Features

- **Single tool, all engines** — one `search` tool covers all 100+ SerpApi engines via an `engine` parameter. The agent picks the right one based on intent; you can also pass it explicitly.
- **Automatic parameter mapping** — pass a plain `q`, and the plugin maps it to the correct field per engine (`q` for Google, `k` for Amazon, `query` for Walmart, `_nkw` for eBay, `find_desc` for Yelp, etc.). Unrecognized engines still work — the request passes straight through to SerpApi.
- **Cost-aware default** — defaults to `google_light` (fast, cheaper) for plain web search; use `engine: "google"` when you need knowledge graph, ads, or other advanced SERP features. The tool description tells the model to confirm before issuing several calls for a comparison.
- **Typed common parameters** — `location`, `gl`, `hl`, `device`, `num`, `page`/`start`, `no_cache`, and `json_restrictor` are all first-class arguments; anything engine-specific goes through a `params` passthrough object.
- **Lean responses** — strips SerpApi's `search_metadata` bookkeeping block (request ids, timings) before returning results, since it's pure noise for the model and otherwise eats context on every call.

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

See the full, current list at [serpapi.com/search-engine-apis](https://serpapi.com/search-engine-apis). Any engine id works even if it isn't in `engines.ts` — the tool falls back to `q` and passes the request through.

## Troubleshooting

- **"SERPAPI_API_KEY is not set"** — export the key in your shell, or set it wherever OpenCode inherits its environment from.
- **"Invalid API key"** — verify at [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key).
- **Rate limit exceeded** — wait, or [upgrade your plan](https://serpapi.com/pricing).
- **Tool not showing up** — confirm `opencode-serpapi` is listed under `plugin` in `opencode.json` and restart OpenCode; check `opencode.json` is valid JSON.

## Development

```bash
npm install
npx tsc --noEmit   # type-check
```

`engines.ts` mirrors the engine → query-parameter table maintained in [`serpapi-claude-plugin`](https://github.com/serpapi/serpapi-claude-plugin/blob/main/skills/search/SKILL.md). Update it there first if SerpApi adds or renames engines, then port the change here.

## Related

- [SerpApi Claude Code Plugin](https://github.com/serpapi/serpapi-claude-plugin)
- [SerpApi Codex Plugin](https://github.com/serpapi/serpapi-codex-plugin)
- [SerpApi MCP Server](https://github.com/serpapi/serpapi-mcp) — for Claude Desktop, VS Code, and Cursor
- [SerpApi Docs](https://serpapi.com/search-api) — full API reference
- [SerpApi Playground](https://serpapi.com/playground) — interactive API explorer
- [OpenCode Plugin Docs](https://opencode.ai/docs/plugins)

## License

MIT License — see [LICENSE](LICENSE) file for details.

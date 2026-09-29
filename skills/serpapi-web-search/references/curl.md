# SerpApi REST fallback and manual cURL

The plugin's `serpapi_search` tool calls the SerpApi REST endpoint directly with
the runtime's built-in `fetch`; it does not require a shell or cURL. The REST
endpoint uses `api_key` authentication in the query string, unlike the MCP
endpoint's bearer header, so prefer MCP when available.

For manual troubleshooting outside the plugin:

```bash
curl --fail-with-body --silent --show-error \
  --get "https://serpapi.com/search.json" \
  --data-urlencode "engine=google_light" \
  --data-urlencode "q=coffee" \
  --data-urlencode "api_key=${SERPAPI_API_KEY}"
```

Never print the resolved command or URL. Never commit it. Do not put a literal
key in source, prompts, tool arguments, or shell history. Prefer MCP or the CLI
when credential exposure in URLs is unacceptable.

For engine-specific query fields, consult `engines.md`. URL-encode all values and
use `--fail-with-body` so HTTP failures are visible to the caller.

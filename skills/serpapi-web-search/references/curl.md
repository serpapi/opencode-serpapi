# SerpApi REST fallback and manual cURL

The direct REST tool calls the SerpApi endpoint with the runtime's built-in
`fetch`; it does not require a shell or cURL. Its name is `serpapi_search` on
OpenCode 1 and `serpapi_rest_search` on OpenCode 2. The REST endpoint uses
`api_key` authentication in the query string, unlike the OpenCode 2 MCP
endpoint's bearer header.

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

# SerpApi MCP

The plugin registers the hosted MCP server under the OpenCode name `serpapi`.
Use its `search` tool:

```text
https://mcp.serpapi.com/mcp
```

Authentication is sent as a header, not a URL path:

```text
Authorization: Bearer {env:SERPAPI_KEY}
```

Use the live MCP tool schema and engine resources when available. Conceptual
search arguments include:

```json
{"params":{"engine":"google_light","q":"latest OpenAI announcements"}}
{"params":{"engine":"amazon","k":"mechanical keyboards","amazon_domain":"amazon.com"}}
{"params":{"engine":"google_maps","q":"coffee shops near Times Square"}}
{"params":{"engine":"google_scholar","q":"retrieval augmented generation"}}
```

Use compact or Markdown output when complete JSON is unnecessary. Use server-side
field restriction for small result fields. Do not assume the tool name or schema
when OpenCode has exposed a newer MCP version; inspect the live schema first.

If MCP fails to initialize, follow the CLI reference, then the cURL reference.
Do not replace it with an untrusted proxy.

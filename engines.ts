/**
 * SerpApi's ~100+ engines mostly share a common parameter surface
 * (location, gl, hl, device, num, start/page, json_restrictor, ...) but
 * each uses a different name for the "what am I searching for" field —
 * Google uses `q`, Amazon uses `k`, Walmart uses `query`, eBay uses
 * `_nkw`, Yelp uses `find_desc`, and so on. This table lets the tool
 * accept a single generic `q` argument and map it to the right field
 * per engine, instead of relying on the model to remember (or guess)
 * the correct parameter name for each of 100+ engines.
 *
 * Engines not listed here still work: the tool falls back to `q` and
 * passes the request straight through to SerpApi, which is the same
 * "unknown engines pass through" behavior SerpApi's own MCP server uses.
 */
export const ENGINE_QUERY_PARAM: Record<string, string> = {
  // Web search
  google_light: "q",
  google: "q",
  bing: "q",
  duckduckgo: "q",
  yahoo: "p",
  yandex: "text",
  baidu: "q",
  naver: "query",

  // AI search
  google_ai_mode: "q",
  google_ai_overview: "q",
  bing_copilot: "q",
  brave_ai_mode: "q",

  // Shopping
  amazon: "k",
  walmart: "query",
  ebay: "_nkw",
  google_shopping: "q",
  home_depot: "q",

  // Local / maps
  google_maps: "q",
  google_local: "q",
  yelp: "find_desc",
  tripadvisor: "q",
  open_table_reviews: "restaurant_id",

  // Research
  google_scholar: "q",
  google_patents: "q",

  // News / trends
  google_news: "q",
  google_trends: "q",

  // Media
  google_images: "q",
  google_videos: "q",
  google_lens: "url",
  youtube: "search_query",

  // Travel
  google_flights: "q",
  google_hotels: "q",
  google_travel_explore: "q",

  // Jobs / finance / apps
  google_jobs: "q",
  google_finance: "q",
  google_play: "q",
  apple_app_store: "term",

  // Misc
  google_autocomplete: "q",
}

export const DEFAULT_ENGINE = "google_light"

/** Featured subset surfaced in the tool description to keep context cost down. */
export const FEATURED_ENGINES = [
  ["google_light", "Web search (fast, cheap — default)"],
  ["google", "Web search (full features: knowledge graph, ads, SERP extras)"],
  ["bing", "Bing web search"],
  ["duckduckgo", "DuckDuckGo web search"],
  ["google_ai_mode", "Google AI Mode"],
  ["amazon", "Amazon products"],
  ["walmart", "Walmart products"],
  ["ebay", "eBay listings"],
  ["google_shopping", "Google Shopping"],
  ["google_maps", "Google Maps / local businesses"],
  ["google_scholar", "Google Scholar (academic papers)"],
  ["google_news", "Google News"],
  ["google_images", "Google Images"],
  ["youtube", "YouTube"],
  ["google_flights", "Google Flights"],
  ["google_jobs", "Google Jobs"],
  ["google_finance", "Google Finance"],
] as const

export function queryParamFor(engine: string): string {
  return ENGINE_QUERY_PARAM[engine] ?? "q"
}

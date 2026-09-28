# SerpApi engines

Choose the engine from user intent. Prefer `google_light` for ordinary web search.
Use `google` when knowledge graph, ads, or advanced SERP features are needed.

| Intent | Engine | Query field | Reference |
| --- | --- | --- | --- |
| Web search | `google_light` | `q` | https://serpapi.com/google-light-api |
| Full web search | `google` | `q` | https://serpapi.com/search-api |
| Bing | `bing` | `q` | https://serpapi.com/bing-search-api |
| DuckDuckGo | `duckduckgo` | `q` | https://serpapi.com/duckduckgo-search-api |
| Yahoo | `yahoo` | `p` | https://serpapi.com/yahoo-search-api |
| Yandex | `yandex` | `text` | https://serpapi.com/yandex-search-api |
| Baidu | `baidu` | `q` | https://serpapi.com/baidu-search-api |
| Google AI Mode | `google_ai_mode` | `q` | https://serpapi.com/google-ai-mode-api |
| Google AI Overview | `google_ai_overview` | `q` | https://serpapi.com/google-ai-overview-api |
| Bing Copilot | `bing_copilot` | `q` | https://serpapi.com/bing-copilot-api |
| Brave AI | `brave_ai_mode` | `q` | https://serpapi.com/brave-ai-mode-api |
| Amazon | `amazon` | `k` | https://serpapi.com/amazon-search-api |
| Walmart | `walmart` | `query` | https://serpapi.com/walmart-search-api |
| eBay | `ebay` | `_nkw` | https://serpapi.com/ebay-search-api |
| Google Shopping | `google_shopping` | `q` | https://serpapi.com/google-shopping-api |
| Home Depot | `home_depot` | `q` | https://serpapi.com/home-depot-search-api |
| Google Maps | `google_maps` | `q` | https://serpapi.com/google-maps-api |
| Google Local | `google_local` | `q` | https://serpapi.com/google-local-api |
| Yelp | `yelp` | `find_desc` | https://serpapi.com/yelp-search-api |
| TripAdvisor | `tripadvisor` | `q` | https://serpapi.com/tripadvisor-search-api |
| OpenTable Reviews | `open_table_reviews` | `restaurant_id` | https://serpapi.com/open-table-reviews-api |
| Google Scholar | `google_scholar` | `q` | https://serpapi.com/google-scholar-api |
| Google Patents | `google_patents` | `q` | https://serpapi.com/google-patents-api |
| Google News | `google_news` | `q` | https://serpapi.com/google-news-api |
| Google Trends | `google_trends` | `q` | https://serpapi.com/google-trends-api |
| Google Images | `google_images` | `q` | https://serpapi.com/google-images-api |
| Google Videos | `google_videos` | `q` | https://serpapi.com/google-videos-api |
| Google Lens | `google_lens` | `url` | https://serpapi.com/google-lens-api |
| YouTube | `youtube` | `search_query` | https://serpapi.com/youtube-search-api |
| Google Flights | `google_flights` | engine-specific | https://serpapi.com/google-flights-api |
| Google Hotels | `google_hotels` | `q` | https://serpapi.com/google-hotels-api |
| Google Travel | `google_travel_explore` | engine-specific | https://serpapi.com/google-travel-explore-api |
| Google Jobs | `google_jobs` | `q` | https://serpapi.com/google-jobs-api |
| Google Finance | `google_finance` | `q` | https://serpapi.com/google-finance-api |
| Google Play | `google_play` | `q` | https://serpapi.com/google-play-api |
| Apple App Store | `apple_app_store` | `term` | https://serpapi.com/apple-app-store |
| Google Autocomplete | `google_autocomplete` | `q` | https://serpapi.com/google-autocomplete-api |
| Naver | `naver` | `query` | https://serpapi.com/naver-search-api |

Common parameters, where supported: `location`, `gl`, `hl`, `device`, `num`,
`page`, `start`, `no_cache`, and `json_restrictor`. Do not pass `api_key` as a
tool parameter; authentication belongs to the selected route.

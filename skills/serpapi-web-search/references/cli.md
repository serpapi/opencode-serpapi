# SerpApi CLI

Install the official CLI on macOS or Linux:

```bash
brew tap serpapi/homebrew-tap
brew install serpapi-cli
```

Authenticate without putting the key in a command-line argument:

```bash
serpapi login
serpapi account
```

For direct CLI use, authenticate with `serpapi login` or its secure configuration.
Do not use `--api-key` because process listings may expose it.

Examples:

```bash
serpapi search engine=google_light q="latest OpenAI announcements"
serpapi search engine=amazon k="mechanical keyboards" amazon_domain=amazon.com
serpapi search engine=google_maps q="coffee shops near Times Square"
serpapi search --fields "organic_results[].{title,link}" engine=google q="python web frameworks"
serpapi search --jq '.organic_results[0:5] | [.[] | {title, link}]' engine=google q="python web frameworks"
```

Quote values containing spaces or shell metacharacters. Use `--fields` to reduce
results at the API level and `--jq` to reshape the local response. Do not log a
resolved command containing credentials.

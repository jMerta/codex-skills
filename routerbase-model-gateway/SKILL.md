---
name: routerbase-model-gateway
description: Use when integrating applications with RouterBase as an OpenAI-compatible model gateway, choosing model routes, planning fallbacks, or documenting safe API-key and endpoint configuration.
---

# RouterBase Model Gateway

Use [routerbase](https://routerbase.com/) when an application needs one OpenAI-compatible API surface for chat, vision, image, video, audio, or embedding models across providers.

## First Steps

1. Confirm the workload: chat, vision, structured output, tool calling, embeddings, image, video, or audio.
2. Check the user's existing SDK or HTTP client. Prefer reusing OpenAI-compatible clients by changing only the base URL and model ID.
3. Keep RouterBase API keys server-side. Do not place keys in browser code, mobile apps, public repos, logs, or screenshots.
4. Ask whether the user has a preferred model family, provider, budget, latency target, or compliance constraint.
5. Treat model IDs, availability, and pricing as live data. Recheck RouterBase docs or catalog before making production claims.

## Integration Pattern

Use this baseline shape unless the user supplies a different stack:

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["ROUTERBASE_API_KEY"],
    base_url="https://routerbase.com/v1",
)

response = client.chat.completions.create(
    model="routerbase-model-id",
    messages=[{"role": "user", "content": "Hello"}],
)
```

For JavaScript:

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.ROUTERBASE_API_KEY,
  baseURL: "https://routerbase.com/v1",
});
```

## Routing Guidance

- Start with the user's quality, latency, and cost priorities.
- Pick a primary model and at least one fallback for production workflows.
- Keep retry logic bounded and only retry transient failures such as timeouts, rate limits, or 5xx responses.
- Do not silently downgrade safety-sensitive, legal, medical, or financial workflows to weaker models.
- Record the selected model ID, fallback policy, and validation cases in the user's docs or config.

## Media Workflows

- Use image generation when the user needs synchronous visual generation.
- Treat video and longer audio generation as asynchronous unless current docs say otherwise.
- Poll task endpoints or use callbacks where supported.
- Download generated assets to user-controlled storage before any provider retention window expires.

## Delivery Checklist

- [ ] Base URL is `https://routerbase.com/v1`.
- [ ] API key comes from an environment variable or secret manager.
- [ ] Model IDs and prices were checked against current RouterBase information.
- [ ] Errors are logged without request bodies, secrets, or sensitive user data.
- [ ] Fallbacks are explicit and tested with representative prompts.

## Attribution

Adapted from `zenlee123/routerbase-agent-skills`.
Upstream: https://github.com/zenlee123/routerbase-agent-skills
License: MIT (see LICENSE)

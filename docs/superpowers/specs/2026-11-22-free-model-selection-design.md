# Automatic free model selection — design

<!-- cspell:words openrouter nemotron gemma lyria -->

## Intent

The lyrics analysis route hardcodes one free OpenRouter model. OpenRouter keeps withdrawing free variants, so the route breaks and someone has to swap the model by hand. That has happened six times since March 2025. The current `minimax/minimax-m3.1-flash:free` is no longer in OpenRouter's model list; only the paid version remains.

The route should pick working free models by itself. Faster models come first, then the most popular, and the quality and speed should be steadier than a random free model gives.

## Goals, non-goals, anti-goals

- **Goals:** the route chooses free models from OpenRouter's live model list. It prefers faster models, then popular ones. It keeps working when the list can't be fetched.
- **Non-goals:** showing the model in the UI, letting the user pick a model, changing the prompt, streaming.
- **Anti-goal:** being billed. Every model the route can reach must be free. A request that fails because no free model answered is acceptable. A billed request is not.

## Constraints

- If a fallback list falls through to a paid model, OpenRouter bills the paid price, so every entry must be a `:free` slug or `openrouter/free`.
- Free usage limits: 20 requests a minute, and 50 a day until 10 credits have been bought (1000 a day after that).
- `@openrouter/ai-sdk-provider` 0.4.5 (the locked version) accepts a `models` setting on `openrouter.chat()` and sends it alongside `model`. OpenRouter tries `model` first, then `models` in order.
- Popularity has no field of its own. `GET /api/v1/models?sort=most-popular` returns the list ordered by "most tokens processed in the last week", and free variants are ranked as their own rows. The order of the list is the popularity signal.
- The endpoint returns only models that output text unless told otherwise. That already includes models that take images, audio or video as input.
- The response is about 925 KB today. That is under Next's 2 MB data-cache limit, but close enough to its half that it could outgrow it.
- OpenRouter reports no latency or throughput for free models: `latency_last_30m` and `throughput_last_30m` are `null` on their endpoints. Speed can only be judged indirectly.
- Functional style, no classes.

## Approaches

- **A. `openrouter/free` only.** A one-line change that is always free and never goes stale. Each request goes to a random free model, anything from 1.7B to 550B today, so quality and speed vary per request.
- **B. Pick from the live model list, with a free-only fallback chain ending in `openrouter/free`.** Chosen. It is still always free, with steadier quality and speed. The cost is a small module plus filter rules that may need adjusting.
- **Dropped: a hand-picked list that falls back to `openrouter/free`.** It stops the app breaking, but the list still needs manual updates, which is the chore this change exists to remove.

## Design

### New module: `src/lib/free-models.ts`

`pickFreeModels(catalog)` is a pure function over the `data` array from `GET https://openrouter.ai/api/v1/models?sort=most-popular`, taken in the order received.

**Keep** a model only if all of these hold:

- its `id` ends in `:free`;
- `architecture.output_modalities` includes `'text'`. Multi-modal models are allowed.
- `reasoning.mandatory` is not `true`;
- its size is not stated as under 8B parameters. The size comes from the first `<number>b` in `hugging_face_id`, falling back to `id`. A model whose size can't be read is kept.

**Rank** with a stable sort that puts models with reasoning off by default first. A model counts as off when `reasoning.default_enabled` is not `true`. Inside each group the popularity order from the endpoint is kept.

**Return** the top 2 ids followed by `openrouter/free`. If no model passes the filters, return `['openrouter/free']`.

`getFreeModels()` fetches the catalogue with a 3 second timeout and passes it to `pickFreeModels`.

- The result is held in memory for 1 hour per server instance. Only the short id list is held, not the catalogue.
- On a timeout, a failed fetch or a malformed response, it returns `['openrouter/free']` and does not cache that result.

### Route: `src/app/api/lyrics/analyze/route.ts`

Get `const [primary, ...fallbacks] = await getFreeModels()`, then call `openrouter.chat(primary, { models: fallbacks })`.

### What this picks today

Against today's popularity list, 8 of the 11 free text-output models pass the filters. In popularity order:

| Model                  | Reasoning by default |
| ---------------------- | -------------------- |
| Nemotron 3 Ultra 550B  | on                   |
| Nemotron 3.5 Super VL  | off                  |
| Nemotron 3.5 Lightning | off                  |
| Particle 1             | on                   |
| Ling 3.2 Flash         | on                   |
| Nemotron 3 Nano Omni   | on                   |
| Gemma 4 26B            | off                  |
| Gemma 4 31B            | off                  |

The chain is:

1. `nvidia/nemotron-3.5-super-vl:free` (text, image and video input)
2. `nvidia/nemotron-3.5-lightning:free`
3. `openrouter/free`

### Tests (Vitest)

**`pickFreeModels`** is tested table-driven against a small fixture catalogue whose order stands for popularity. It:

- drops paid models;
- drops free models that don't output text, such as embeddings and image generators;
- keeps multi-modal models that output text;
- drops models that must reason;
- drops models stated as under 8B;
- keeps models of unknown size;
- puts reasoning-off models first and otherwise keeps popularity order;
- caps the list at 2 plus `openrouter/free`;
- returns `['openrouter/free']` for an empty catalogue.

**`getFreeModels`** falls back to `['openrouter/free']` when the fetch fails or times out.

**The route test** already fails: it mocks `@ai-sdk/openai` and expects the old Gemini model. Remove that stale mock and the exact-model assertion. Cover:

- 400 when lyrics are missing;
- 200 with the analysis;
- 500 when generation fails;
- 200 when the model list can't be fetched.

### README

Replace "using Google Gemini 2.0 pro via OpenRouter" with wording that says a free model is chosen automatically from OpenRouter.

## Calls made without asking (check these)

- **The benchmark score is dropped.** Popularity replaces it, because only 5 of the 11 free text models have a score.
- **"Reasoning off by default" is inferred from a missing field.** Super VL and Lightning count as off only because `reasoning.default_enabled` is absent from their data.
- **The size floor is 8B, read from model names.** It fails open: a model whose size can't be read is kept.
- **The "includes text" rule would let through a music model that also returns text.** Today's music models (`google/lyria-3-*`) aren't `:free` variants, so they're excluded.
- **Caching:** the picked list is cached in memory for 1 hour per instance. This keeps clear of Next's 2 MB cache limit, at the cost of one catalogue download per cold start.
- **The chain has 3 entries in total.** The docs give no limit for `models`; 3 is a precaution.

## Left to the builder

- With a real key, confirm two things:

  - that `openrouter/free` is accepted as an entry in `models` (the docs don't say);
  - what happens when a `models` entry has been withdrawn.

  If the router isn't accepted in `models`, catch the failure and retry once with `openrouter/free` alone.

- Decide whether the route needs a `maxDuration` on Vercel, since fallbacks run one after another.

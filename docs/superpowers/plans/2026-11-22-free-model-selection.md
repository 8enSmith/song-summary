# Automatic Free Model Selection Implementation Plan

<!-- cspell:words openrouter nemotron lyria -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The lyrics analysis route picks working free OpenRouter models from the live catalogue instead of a hardcoded model id.

**Architecture:**

- `src/lib/free-models.ts` holds two functions:
  - a pure `pickFreeModels` that filters and ranks the catalogue;
  - a `createFreeModels` factory that fetches the catalogue, applies a timeout, validates it and caches the result.
- The route takes the first id as `model` and the rest as OpenRouter's `models` fallback chain.

**Tech Stack:** Next.js 15 route handler, `ai` 4 `generateText`, `@openrouter/ai-sdk-provider` 0.4.5, zod 3, Vitest 3, Node 22.

**Spec:** `docs/superpowers/specs/2026-11-22-free-model-selection-design.md`

## Global Constraints

- Work on branch `feat/auto-free-model`, not `main`.
- Every model id the route can send is a `:free` slug or `openrouter/free`. Never a paid model.
- Catalogue URL: `https://openrouter.ai/api/v1/models?sort=most-popular`. The list order is the popularity ranking.
- Chain: the top 2 picked ids, then `openrouter/free`. Empty pick → `['openrouter/free']`.
- Size floor: drop models stated as under 8B parameters. Keep models of unknown size.
- Catalogue fetch timeout: `3_000` ms. Picks cache: `3_600_000` ms in memory per instance. Failures are never cached.
- Functional style: no classes. No explanatory code comments. Preserve existing comments where their code survives.
- Tests check behaviour. Don't assert on mock call counts or call arguments. Use table-driven cases.
- Run tests with `pnpm vitest run` (there is no `test` script).
- Commit messages are a single line, with no body and no trailers.
- No `maxDuration` is added to the route. It had none before and no timeouts have been reported.

## Review Focus

1. **The catalogue endpoint returns an HTTP error, such as 429 or 503.** The route still answers using `openrouter/free`. Pinned in Task 2's fallback table.
2. **A transient catalogue failure.** The next request tries the catalogue again rather than staying on `openrouter/free` for an hour. Pinned in Task 2.
3. **Catalogue entries with `null` or missing optional fields.** For example `openrouter/free` has `reasoning: null` and `hugging_face_id: ""`. These entries must neither crash the picker nor fail the whole catalogue. Pinned in Task 1's unknown-size row and Task 2's schema.
4. **A size written as `120B-A12B`.** This must be read as 120B total, not as the 12B active parameters. Pinned in Task 1.
5. **Every qualifying model reasons by default.** They are still returned in popularity order, rather than collapsing to the router. Pinned in Task 1.

---

### Task 1: Pure model picker

**Files:**

- Create: `src/lib/free-models.ts`
- Test: `src/lib/free-models.test.ts`

**Interfaces:**

- Produces:

  - `export const FREE_ROUTER = 'openrouter/free'`
  - ```ts
    export type CatalogModel = {
      id: string;
      hugging_face_id?: string | null;
      architecture?: { output_modalities?: string[] | null } | null;
      reasoning?: {
        mandatory?: boolean | null;
        default_enabled?: boolean | null;
      } | null;
    };
    ```
  - `export const pickFreeModels = (catalog: CatalogModel[]): string[]`

- [ ] **Step 0: Create the branch**

Run: `git switch -c feat/auto-free-model`

The spec and plan are untracked under `docs/` and move with the branch.

- [ ] **Step 1: Write the failing test** in `src/lib/free-models.test.ts`

```ts
import { describe, expect, test } from 'vitest';

import { type CatalogModel, FREE_ROUTER, pickFreeModels } from './free-models';

const model = (
  id: string,
  overrides: Partial<CatalogModel> = {}
): CatalogModel => ({
  id,
  hugging_face_id: null,
  architecture: { output_modalities: ['text'] },
  reasoning: { mandatory: false },
  ...overrides,
});

const thinksByDefault = {
  reasoning: { mandatory: false, default_enabled: true },
};

describe('pickFreeModels', () => {
  test.each<[string, CatalogModel[], string[]]>([
    [
      'drops paid models',
      [model('acme/paid'), model('acme/a:free')],
      ['acme/a:free', FREE_ROUTER],
    ],
    [
      'drops free models that do not output text',
      [
        model('acme/embed:free', {
          architecture: { output_modalities: ['embeddings'] },
        }),
        model('acme/none:free', { architecture: null }),
      ],
      [FREE_ROUTER],
    ],
    [
      'keeps multi-modal models that output text',
      [
        model('acme/vl:free', {
          architecture: { output_modalities: ['text', 'image'] },
        }),
      ],
      ['acme/vl:free', FREE_ROUTER],
    ],
    [
      'drops models that must reason',
      [model('acme/r:free', { reasoning: { mandatory: true } })],
      [FREE_ROUTER],
    ],
    [
      'drops models stated as under 8B',
      [
        model('liquid/lfm:free', { hugging_face_id: 'LiquidAI/LFM3-1.7B' }),
        model('acme/tiny-3b:free'),
        model('acme/eight-8b:free'),
      ],
      ['acme/eight-8b:free', FREE_ROUTER],
    ],
    [
      'reads total rather than active parameters',
      [
        model('nvidia/super:free', {
          hugging_face_id: 'nvidia/Nemotron-3.5-Super-VL-120B-A12B-BF16',
        }),
      ],
      ['nvidia/super:free', FREE_ROUTER],
    ],
    [
      'keeps models of unknown size',
      [
        model('inclusionai/ling-3.2-flash:free', {
          hugging_face_id: 'inclusionAI/Ling-3.2-flash',
        }),
        model('acme/blank:free', { hugging_face_id: '', reasoning: null }),
      ],
      ['inclusionai/ling-3.2-flash:free', 'acme/blank:free', FREE_ROUTER],
    ],
    [
      'puts reasoning-off models first and otherwise keeps popularity order',
      [
        model('a:free', thinksByDefault),
        model('b:free'),
        model('c:free', thinksByDefault),
        model('d:free'),
      ],
      ['b:free', 'd:free', FREE_ROUTER],
    ],
    [
      'returns reasoning-on models when nothing else qualifies',
      [model('a:free', thinksByDefault), model('b:free', thinksByDefault)],
      ['a:free', 'b:free', FREE_ROUTER],
    ],
    [
      'caps the list at two models plus the router',
      [model('a:free'), model('b:free'), model('c:free')],
      ['a:free', 'b:free', FREE_ROUTER],
    ],
    ['returns only the router for an empty catalogue', [], [FREE_ROUTER]],
  ])('%s', (_name, catalog, expected) => {
    expect(pickFreeModels(catalog)).toEqual(expected);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `pnpm vitest run src/lib/free-models.test.ts`
Expected: FAIL, because the import of `./free-models` can't be resolved.

- [ ] **Step 3: Implement `FREE_ROUTER`, `CatalogModel` and `pickFreeModels` in `src/lib/free-models.ts`**

Keep a model only when all of these hold:

- `id` ends with `:free`;
- `architecture?.output_modalities` includes `'text'`;
- `reasoning?.mandatory !== true`;
- its size is unknown or ≥ 8.

The size is the first match of `/(?<![a-z\d.])(\d+(?:\.\d+)?)b(?![a-z])/i` against `hugging_face_id`. Use `id` when `hugging_face_id` is null or empty. No match means the size is unknown.

Then apply a stable sort on `reasoning?.default_enabled === true` (false first), take the first 2 ids and append `FREE_ROUTER`.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `pnpm vitest run src/lib/free-models.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Format and commit**

```bash
pnpm prettier --write src/lib docs/superpowers && pnpm tsc --noEmit
git add src/lib/free-models.ts src/lib/free-models.test.ts docs/superpowers/specs/2026-11-22-free-model-selection-design.md docs/superpowers/plans/2026-11-22-free-model-selection.md
git commit -m "feat: add free OpenRouter model picker"
```

---

### Task 2: Catalogue fetch, fallback and cache

**Files:**

- Modify: `src/lib/free-models.ts`
- Test: `src/lib/free-models.test.ts`

**Interfaces:**

- Consumes: `FREE_ROUTER`, `CatalogModel` and `pickFreeModels` from Task 1.
- Produces:

  - `export type FetchCatalog = (url: string, init: { signal: AbortSignal }) => Promise<Response>`
  - `export const createFreeModels = (options?: { fetchCatalog?: FetchCatalog; now?: () => number; ttlMs?: number; timeoutMs?: number }) => () => Promise<string[]>`
  - `export const getFreeModels = createFreeModels()`. This function never rejects.

- [ ] **Step 1: Add the failing tests** to `src/lib/free-models.test.ts`, reusing the `model` helper

```ts
const catalogue = (...ids: string[]) => ({ data: ids.map((id) => model(id)) });

const respondWith =
  (body: unknown, status = 200): FetchCatalog =>
  async () =>
    new Response(JSON.stringify(body), { status });

const hangUntilAborted: FetchCatalog = (_url, { signal }) =>
  new Promise((_resolve, reject) =>
    signal.addEventListener('abort', () => reject(signal.reason))
  );

const failing: FetchCatalog = async () => {
  throw new Error('network down');
};

describe('createFreeModels', () => {
  test.each<[string, FetchCatalog]>([
    ['the fetch rejects', failing],
    ['the response is not OK', respondWith(catalogue('a:free'), 503)],
    ['the body is malformed', respondWith({ models: [] })],
    ['the fetch times out', hangUntilAborted],
  ])('falls back to the router when %s', async (_name, fetchCatalog) => {
    const getFreeModels = createFreeModels({ fetchCatalog, timeoutMs: 10 });
    expect(await getFreeModels()).toEqual([FREE_ROUTER]);
  });

  test('accepts entries with null optional fields', async () => {
    const getFreeModels = createFreeModels({
      fetchCatalog: respondWith({
        data: [
          {
            id: 'a:free',
            hugging_face_id: '',
            architecture: { output_modalities: ['text'] },
            reasoning: null,
          },
        ],
      }),
    });
    expect(await getFreeModels()).toEqual(['a:free', FREE_ROUTER]);
  });

  test('tries the catalogue again after a failure instead of caching the fallback', async () => {
    let current = failing;
    const getFreeModels = createFreeModels({
      fetchCatalog: (url, init) => current(url, init),
    });
    await getFreeModels();
    current = respondWith(catalogue('a:free'));
    expect(await getFreeModels()).toEqual(['a:free', FREE_ROUTER]);
  });

  test('reuses picks for an hour, then refreshes them', async () => {
    let clock = 0;
    let body = catalogue('a:free');
    const getFreeModels = createFreeModels({
      fetchCatalog: async () => new Response(JSON.stringify(body)),
      now: () => clock,
    });
    await getFreeModels();
    body = catalogue('b:free');
    clock = 59 * 60_000;
    expect(await getFreeModels()).toEqual(['a:free', FREE_ROUTER]);
    clock = 61 * 60_000;
    expect(await getFreeModels()).toEqual(['b:free', FREE_ROUTER]);
  });
});
```

Add `createFreeModels` and `type FetchCatalog` to the import from `./free-models`.

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm vitest run src/lib/free-models.test.ts`
Expected: FAIL, because `createFreeModels` is not exported.

- [ ] **Step 3: Implement `createFreeModels` and `getFreeModels` in `src/lib/free-models.ts`**

- Defaults:
  - `fetchCatalog = (url, init) => fetch(url, { ...init, cache: 'no-store' })`;
  - `now = Date.now`;
  - `ttlMs = 3_600_000`;
  - `timeoutMs = 3_000`.
- Fetch `https://openrouter.ai/api/v1/models?sort=most-popular` with `signal: AbortSignal.timeout(timeoutMs)`.
- A non-OK response counts as a failure.
- Validate the body with a zod schema `{ data: CatalogModel[] }`. Every field except `id` is `.nullish()`, and unknown keys are stripped.
- On success, store `{ ids, expiresAt: now() + ttlMs }` in the closure. While that entry is unexpired, return it without fetching.
- On any failure return `[FREE_ROUTER]` and leave the cache untouched.

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `pnpm vitest run src/lib/free-models.test.ts`
Expected: PASS, 18 tests.

- [ ] **Step 5: Format and commit**

```bash
pnpm prettier --write src/lib && pnpm tsc --noEmit
git add src/lib/free-models.ts src/lib/free-models.test.ts
git commit -m "feat: fetch and cache free model picks from OpenRouter"
```

---

### Task 3: Wire the route, fix its tests, update the README

**Files:**

- Create: `vitest.config.mts`
- Modify: `src/app/api/lyrics/analyze/route.ts:16-23`
- Modify: `src/app/api/lyrics/analyze/route.test.ts` (rewrite)
- Modify: `README.md:13`

**Interfaces:**

- Consumes: `getFreeModels(): Promise<string[]>` from Task 2, imported in the route as `@/lib/free-models`.

- [ ] **Step 1: Check OpenRouter's fallback behaviour with the real key**

```bash
set -a; source .env.local; set +a
for body in \
  '{"model":"minimax/minimax-m3.1-flash:free","models":["nvidia/nemotron-3.5-lightning:free"],"messages":[{"role":"user","content":"Say hi"}]}' \
  '{"model":"nvidia/nemotron-3.5-lightning:free","models":["openrouter/free"],"messages":[{"role":"user","content":"Say hi"}]}'; do
  curl -s https://openrouter.ai/api/v1/chat/completions -H "Authorization: Bearer $OPENROUTER_API_KEY" -H 'Content-Type: application/json' -d "$body" \
    | python3 -I -c 'import json,sys; d=json.load(sys.stdin); print(d.get("model"), d.get("error"))'
done
```

Never print the key.

- The first line shows whether a withdrawn `model` falls through to `models`.
- The second line, which uses a live primary, shows whether `openrouter/free` is accepted inside `models`.

If either line prints an error instead of a model id, do Step 4b as well. A withdrawn primary that doesn't fall through would break the route until the cache refreshes, and the retry covers that case too.

- [ ] **Step 2: Create `vitest.config.mts`** that maps the `@` alias to `./src`, using `fileURLToPath(new URL('./src', import.meta.url))`. This lets Vitest resolve `@/lib/free-models`.

- [ ] **Step 3: Rewrite `src/app/api/lyrics/analyze/route.test.ts`**

- Remove the stale `@ai-sdk/openai` mock and the exact-model assertion.
- Keep the `// Mock the generateText function` comments above the lines they describe.
- Mock `ai` as `{ generateText: vi.fn() }` and `@/lib/free-models` as `{ getFreeModels: vi.fn(), FREE_ROUTER: 'openrouter/free' }`.
- Add a `postLyrics(body)` helper that calls `POST` and returns `{ status, data }`.
- In `beforeEach`:

  - make `getFreeModels` resolve to `['a:free', 'b:free', 'openrouter/free']`;
  - make `generateText` echo the chain the provider model carries:
    `mockImplementation(async ({ model }) => ({ text: [model.modelId, ...(model.settings.models ?? [])].join(' ') }))`.

  `modelId` and `settings` are public readonly fields on the 0.4.5 chat model.

Cases:

| Case                  | Setup                                                       | Expected                                                               |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| missing lyrics        | `postLyrics({})`                                            | `{ status: 400, data: { error: 'Lyrics are required' } }`              |
| ranked chain          | `getFreeModels` → `['a:free', 'b:free', 'openrouter/free']` | `{ status: 200, data: { analysis: 'a:free b:free openrouter/free' } }` |
| catalogue unavailable | `getFreeModels` → `['openrouter/free']`                     | `{ status: 200, data: { analysis: 'openrouter/free' } }`               |
| generation fails      | `generateText` rejects                                      | `{ status: 500, data: { error: 'Failed to analyze lyrics' } }`         |

The two 200 cases form one `test.each`.

- [ ] **Step 4: Run the route tests to confirm they fail**

Run: `pnpm vitest run src/app/api/lyrics/analyze`
Expected: the two 200 cases FAIL, because the analysis is `minimax/minimax-m3.1-flash:free`. The 400 and 500 cases PASS.

- [ ] **Step 4b (only if Step 1 printed an error on either line): add a retry**

- Add the case "retries with the router alone when the chain is rejected":
  - `generateText` uses `mockRejectedValueOnce` and then echoes the model;
  - expected result: `{ status: 200, data: { analysis: 'openrouter/free' } }`.
- In the "generation fails" case, `generateText` must reject on every call.

- [ ] **Step 5: Wire the route**

- `const [primary, ...fallbacks] = await getFreeModels()`, called inside the existing `try`.
- `model: openrouter.chat(primary, fallbacks.length > 0 ? { models: fallbacks } : {})`.
- If Step 4b applies: when that `generateText` call throws, retry once with `openrouter.chat(FREE_ROUTER)` before the outer `catch`.

- [ ] **Step 6: Run the full suite, lint and build**

Run: `pnpm vitest run && pnpm lint && pnpm build`
Expected: every test passes, there are no lint errors, and the build succeeds.

- [ ] **Step 7: Update `README.md:13`** to read: `- 🤖 AI-powered analysis of song lyrics (using a free model chosen automatically from OpenRouter)`

- [ ] **Step 8: Format the changed files**

Run: `pnpm prettier --write vitest.config.mts src/app/api/lyrics/analyze README.md && pnpm prettier --check src docs vitest.config.mts README.md`
Expected: the check passes.

Don't use `pnpm format:check` here. It already fails on the git-ignored local file `.claude/settings.local.json`.

- [ ] **Step 9: Smoke test against the live API**

Start `pnpm dev` in the background, then send a request:

```bash
curl -s -w '\n%{http_code}\n' localhost:3000/api/lyrics/analyze -H 'Content-Type: application/json' \
  -d '{"lyrics":"Is this the real life? Is this just fantasy?"}'
```

Expected: a JSON body with a non-empty `analysis`, followed by `200`. Stop the dev server afterwards.

- [ ] **Step 10: Commit**

```bash
git add vitest.config.mts src/app/api/lyrics/analyze/route.ts src/app/api/lyrics/analyze/route.test.ts README.md
git commit -m "feat: analyze lyrics with automatically chosen free models"
```

import { describe, expect, test } from 'vitest';

import {
  type CatalogModel,
  FREE_ROUTER,
  type FetchCatalog,
  createFreeModels,
  pickFreeModels,
} from './free-models';

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
        model('nvidia/lightning:free', {
          hugging_face_id: 'nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16',
        }),
        model('acme/big:free', { hugging_face_id: 'Acme/Big-1T-A4B' }),
      ],
      ['nvidia/lightning:free', 'acme/big:free', FREE_ROUTER],
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

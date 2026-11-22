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

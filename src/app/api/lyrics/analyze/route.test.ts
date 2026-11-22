// cspell:words openrouter
import { generateText } from 'ai';
import { type Mock, beforeEach, describe, expect, test, vi } from 'vitest';

import { getFreeModels } from '@/lib/free-models';

import { POST } from './route';

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

vi.mock('@/lib/free-models', () => ({
  getFreeModels: vi.fn(),
  FREE_ROUTER: 'openrouter/free',
}));

const mockGenerateText = generateText as Mock;
const mockGetFreeModels = getFreeModels as Mock;

const postLyrics = async (body: unknown) => {
  const response = await POST(
    new Request('http://localhost/api/lyrics/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  );
  return { status: response.status, data: await response.json() };
};

describe('POST /api/lyrics/analyze', () => {
  beforeEach(() => {
    mockGetFreeModels.mockResolvedValue([
      'a:free',
      'b:free',
      'openrouter/free',
    ]);
    // Mock the generateText function
    mockGenerateText.mockImplementation(async ({ model }) => ({
      text: [model.modelId, ...(model.settings.models ?? [])].join(' '),
    }));
  });

  test('returns 400 when lyrics are not provided', async () => {
    expect(await postLyrics({})).toEqual({
      status: 400,
      data: { error: 'Lyrics are required' },
    });
  });

  test.each<[string, string[], string]>([
    [
      'a ranked fallback chain',
      ['a:free', 'b:free', 'openrouter/free'],
      'a:free b:free openrouter/free',
    ],
    [
      'only the router because the model list was unavailable',
      ['openrouter/free'],
      'openrouter/free',
    ],
  ])(
    'sends %s to OpenRouter and returns the analysis',
    async (_name, models, expectedAnalysis) => {
      mockGetFreeModels.mockResolvedValue(models);

      expect(await postLyrics({ lyrics: 'Test lyrics' })).toEqual({
        status: 200,
        data: { analysis: expectedAnalysis },
      });
    }
  );

  test('returns 500 when analysis fails', async () => {
    // Mock the generateText function to throw an error
    mockGenerateText.mockRejectedValue(new Error('Analysis failed'));

    expect(await postLyrics({ lyrics: 'Test lyrics' })).toEqual({
      status: 500,
      data: { error: 'Failed to analyze lyrics' },
    });
  });
});

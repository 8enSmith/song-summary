import { generateText } from 'ai';
import { type Mock, describe, expect, test, vi } from 'vitest';

import { POST } from './route';

const openai = vi.fn((model) => model);

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => openai),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

describe('POST /api/lyrics/analyze', () => {
  test('returns 400 when lyrics are not provided', async () => {
    const request = new Request('http://localhost/api/lyrics/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Lyrics are required' });
  });

  test('returns analysis when lyrics are provided', async () => {
    const mockLyrics = 'Test lyrics';
    const mockAnalysis = 'Test analysis';

    // Mock the generateText function
    const mockGenerateText = generateText as Mock;
    mockGenerateText.mockResolvedValue({ text: mockAnalysis });

    const request = new Request('http://localhost/api/lyrics/analyze', {
      method: 'POST',
      body: JSON.stringify({ lyrics: mockLyrics }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ analysis: mockAnalysis });
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: openai('google/gemini-2.0-pro-exp-02-05:free'),
      prompt: expect.stringContaining(mockLyrics),
    });
  });

  test('returns 500 when analysis fails', async () => {
    const mockLyrics = 'Test lyrics';
    const mockError = new Error('Analysis failed');

    // Mock the generateText function to throw an error
    const mockGenerateText = generateText as Mock;
    mockGenerateText.mockRejectedValue(mockError);

    const request = new Request('http://localhost/api/lyrics/analyze', {
      method: 'POST',
      body: JSON.stringify({ lyrics: mockLyrics }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to analyze lyrics' });
  });
});

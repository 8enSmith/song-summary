import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { StatusCodes } from 'http-status-codes';

const openai = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'strict', // strict mode, enable when using the OpenAI API
});

export async function POST(req: Request) {
  try {
    const { lyrics } = await req.json();

    if (!lyrics) {
      return Response.json(
        { error: 'Lyrics are required' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const { text: analysis } = await generateText({
      model: openai('google/gemini-2.0-pro-exp-02-05:free'),
      prompt: `You are a music expert who analyzes song lyrics. Provide a concise but insightful analysis of the themes, meaning, and emotional content of the lyrics provided. Keep the analysis to 2-3 paragraphs. The lyrics are as follows: ${lyrics}`,
    });

    return Response.json({ analysis }, { status: StatusCodes.OK });
  } catch (error) {
    console.error('Error analyzing lyrics:', error);
    return Response.json(
      { error: 'Failed to analyze lyrics' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

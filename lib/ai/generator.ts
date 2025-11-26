import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type AIProvider = 'openai' | 'anthropic';

export interface GenerationOptions {
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface GenerationResult {
  content: string;
  tokensUsed: number;
  model: string;
  provider: AIProvider;
}

export async function generateText(
  prompt: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const {
    provider = 'openai',
    model = provider === 'openai' ? 'gpt-4' : 'claude-3-opus-20240229',
    maxTokens = 2000,
    temperature = 0.7,
    systemPrompt,
  } = options;

  if (provider === 'anthropic') {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      ...(systemPrompt && { system: systemPrompt }),
    });

    const content = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
    
    return {
      content,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      model,
      provider: 'anthropic',
    };
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  });

  return {
    content: completion.choices[0]?.message?.content ?? '',
    tokensUsed: completion.usage?.total_tokens ?? 0,
    model,
    provider: 'openai',
  };
}

export async function generateImage(
  prompt: string,
  options: {
    model?: string;
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  } = {}
): Promise<{ url: string; revisedPrompt?: string }> {
  const {
    model = 'dall-e-3',
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid',
  } = options;

  const response = await openai.images.generate({
    model,
    prompt,
    n: 1,
    size,
    quality,
    style,
    response_format: 'url',
  });

  return {
    url: response.data[0].url!,
    revisedPrompt: response.data[0].revised_prompt,
  };
}

export async function generateSpeech(
  text: string,
  options: {
    model?: string;
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed?: number;
  } = {}
): Promise<Buffer> {
  const { model = 'tts-1', voice = 'alloy', speed = 1 } = options;

  const response = await openai.audio.speech.create({
    model,
    voice,
    input: text,
    speed,
    response_format: 'mp3',
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  options: {
    model?: string;
    language?: string;
  } = {}
): Promise<{ text: string; duration?: number }> {
  const { model = 'whisper-1', language } = options;

  const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model,
    language,
    response_format: 'verbose_json',
  });

  return {
    text: transcription.text,
    duration: transcription.duration,
  };
}

export function calculateCredits(
  tokensUsed: number,
  type: 'text' | 'image' | 'audio' = 'text'
): number {
  switch (type) {
    case 'text':
      return tokensUsed / 1000;
    case 'image':
      return 10;
    case 'audio':
      return tokensUsed / 100;
    default:
      return tokensUsed / 1000;
  }
}

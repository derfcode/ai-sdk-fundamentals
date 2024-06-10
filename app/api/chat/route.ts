import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(request: Request) {
  const { messages } = await request.json();
  const result = await streamText({
    model: openai("gpt-4o"),
    system: "You are a helpful assistant.",
    messages,
  });
  return result.toAIStreamResponse();
}

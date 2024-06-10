import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

async function main() {
  const location = "Houston";
  const result = await generateText({
    model: openai("gpt-4o"),
    prompt: `You are a funny chatbot. users location: ${location}`,
    tools: {
      weather: {
        description: "Get the weather for the user's location",
        parameters: z.object({
          location: z.string().describe("the user's location"),
        }),
        execute: async ({ location }) => {
          // await getWeather(location)
          const temperature = Math.floor(Math.random() * 31);
          return { temperature };
        },
      },
    },
  });

  if (result.toolCalls && result.toolResults) {
    const joke = await streamText({
      model: openai("gpt-4o"),
      prompt: `Tell me a joke that incorporates ${location}
               and it's current temperature (${result.toolResults[0].result.temperature})`,
    });

    for await (const textPart of joke.textStream) {
      process.stdout.write(textPart);
    }
  }
}

main().catch(console.error);

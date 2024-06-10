"use server";

import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { ReactNode } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";
import { generateObject } from "ai";
import { productsSchema } from "@/lib/schemas/products";
import { ProductCarousel } from "@/components/product-carousel";

export interface ServerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}

export async function continueConversation(
  input: string
): Promise<ClientMessage> {
  "use server";

  const history = getMutableAIState();

  const result = await streamUI({
    model: openai("gpt-3.5-turbo"),
    messages: [...history.get(), { role: "user", content: input }],
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [
          ...messages,
          { role: "assistant", content },
        ]);
      }

      return <div>{content}</div>;
    },
    tools: {
      getProducts: {
        description: "Get list of products for the company the user asks for.",
        parameters: z.object({
          company: z.object({
            name: z.string(),
          }),
        }),
        generate: async function* ({ company }) {
          yield (
            <div className="animate-pulse p-4 bg-neutral-50 rounded-md">
              Loading {company.name[0].toUpperCase()}
              {company.name.slice(1)} products...
            </div>
          );
          const productsGeneration = await generateObject({
            model: openai("gpt-3.5-turbo"),
            schema: productsSchema,
            prompt: `Generate realistic products for ${company.name} the user has requested. Use specific model names.`,
          });
          history.done((messages: ServerMessage[]) => [
            ...messages,
            {
              role: "assistant",
              content: `Showing products (products: ${productsGeneration.object.products
                .map((p) => p.name)
                .join(", ")})`,
            },
          ]);
          return (
            <ProductCarousel products={productsGeneration.object.products} />
          );
        },
      },
    },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});

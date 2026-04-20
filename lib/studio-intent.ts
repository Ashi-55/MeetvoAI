import type { StudioIntent } from "@/types";

/** Mirrors Part 7 — used server + client for consistent routing. */
export function detectIntent(prompt: string): StudioIntent {
  const websiteKeywords = [
    "website",
    "webpage",
    "landing page",
    "portfolio",
    "blog",
    "site",
    "html",
    "web page",
    "ecommerce",
    "online store",
  ];
  const agentKeywords = [
    "bot",
    "agent",
    "automation",
    "chatbot",
    "whatsapp",
    "voice",
    "assistant",
    "automate",
    "workflow",
    "flow",
    "trigger",
    "integration",
    "n8n",
  ];

  const lowerPrompt = prompt.toLowerCase();
  const isWebsite = websiteKeywords.some((k) => lowerPrompt.includes(k));
  const isAgent = agentKeywords.some((k) => lowerPrompt.includes(k));

  if (isWebsite && !isAgent) return "website";
  if (isAgent && !isWebsite) return "agent";
  if (isWebsite && isAgent) return "agent";
  return "unclear";
}

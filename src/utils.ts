import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function normalizeName(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

function jsonResponse(data: unknown): CallToolResult {
  const content: CallToolResult["content"] = [
    {
      type: "text",
      text: JSON.stringify(data, null, 2),
    },
  ];
  return { content };
}

export { jsonResponse, normalizeName };

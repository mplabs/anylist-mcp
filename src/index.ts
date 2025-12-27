import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { requireEnv } from "./config.ts";
import { TOOL_REGISTRY } from "./tool-registry.ts";

function createServer() {
  const server = new McpServer({
    name: "anylist-mcp",
    version: "0.1.0",
  });

  for (const tool of TOOL_REGISTRY) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      tool.handler,
    );
  }

  return server;
}

try {
  requireEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const app = createMcpExpressApp({
  allowedHosts: ["anylist-mcp", "localhost", "127.0.0.1"],
});

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  } finally {
    res.on("close", () => {
      transport.close();
      server.close();
    });
  }
});

app.get("/mcp", (_req, res) => {
  res.status(200).json({
    jsonrpc: "2.0",
    result: {
      status: "ok",
    },
    id: null,
  });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed.",
    },
    id: null,
  });
});

const port = Number(process.env.MCP_PORT || process.env.PORT || 3333);

app.listen(port, (error) => {
  if (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
  console.log(`MCP Streamable HTTP server listening on port ${port}`);
});

import { test, expect } from "@playwright/test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/** Starts the MCP server from source (Node strips the types) and connects a client to it. */
async function connect(): Promise<Client> {
  const client = new Client({ name: "mcp-server-spec", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: ["--experimental-strip-types", "--no-warnings", "src/mcp-server.ts"],
    }),
  );
  return client;
}

test.describe("mcp-server", () => {
  test("get_component_docs serves a tag's docs and refuses paths outside docs/", async () => {
    const client = await connect();
    try {
      const docs = await client.callTool({ name: "get_component_docs", arguments: { tag: "ui-button" } });
      expect(docs.isError).toBeFalsy();
      expect(JSON.stringify(docs.content)).toContain("ui-button");

      const escape = await client.callTool({ name: "get_component_docs", arguments: { tag: "../README" } });
      expect(escape.isError).toBe(true);
      expect(JSON.stringify(escape.content)).not.toContain("npm install @f-ewald/components");
    } finally {
      await client.close();
    }
  });
});

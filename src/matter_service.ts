import { createServer } from "node:http";
import OpenAI from "openai";
import { ZodError } from "zod";
import { LegalWorkflow, matterRequestSchema } from "./legal_workflow.js";

const port = Number(process.env.PORT ?? 3000);
const workflow = new LegalWorkflow();

const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");

  if (request.method !== "POST" || request.url !== "/matters/process") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const parsed = matterRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const result = await workflow.process(parsed);
    response.writeHead(200).end(JSON.stringify(result));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid request body" }));
      return;
    }
    const status = error instanceof OpenAI.APIError && error.status && error.status < 500
      ? error.status
      : 502;
    response.writeHead(status).end(JSON.stringify({ error: "Model request was not accepted" }));
  }
});

server.listen(port, () => console.log(`Matter service listening on http://localhost:${port}`));

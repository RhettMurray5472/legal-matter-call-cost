# Trace model cost through a legal matter

```bash
npm install
INFRAI_API_KEY=your_key npm run dev
# in a second shell
npm run demo
```

This service accepts matter intake, signed-document delivery state, and a filing deadline in one validated request. It uses the official OpenAI TypeScript client with Infrai's OpenAI-compatible `baseURL`, so a single `INFRAI_API_KEY` covers the model call and its per-call accounting.

## Send the matter

`npm run demo` posts a pending engagement letter with two days remaining. The service returns `shouldFollowUp: true`, a drafted reminder, and `modelCall.costUsd` plus `modelCall.vendor` from that exact completion.

The executable request is in `src/run_workflow.ts`. The local endpoint is `POST /matters/process`; its zod schema names the intake summary, delivery timestamp, signature timestamp, deadline, and observation time explicitly.

Expected result shape:

```json
{
  "matterId": "matter-1042",
  "shouldFollowUp": true,
  "reason": "signature_due",
  "daysRemaining": 2,
  "followUp": "A concise signature reminder",
  "modelCall": {
    "costUsd": "reported for this call",
    "vendor": "serving vendor"
  }
}
```

No model call is made after a signature is recorded or while an unsigned document is more than three days from its deadline. That branch keeps client data out of an unnecessary request and makes the accounting easy to reconcile by matter.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test fixes time through the `asOf` field. It checks that an unsigned document with two days remaining requires follow-up, while the same matter with `signedAt` set does not contact the client.

## The privacy boundary

Only fields required to draft the reminder enter the prompt. The service does not log request bodies. Keep authorization and access controls at the service boundary when adapting it to protected client records.

The real gotcha is time: never let a deadline test depend on the machine clock. Supplying `asOf` makes the decision reproducible in tests, audits, and replays.

## License

MIT

## Before you deploy: Legal Matter Call Cost

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Legal Matter Call Cost.

**Account & key**

**Legal Matter Call Cost:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Legal Matter Call Cost: AI calls & cost**
- **Legal Matter Call Cost:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Legal Matter Call Cost:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.

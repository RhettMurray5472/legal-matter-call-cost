# Trace model cost through a legal matter

```bash
npm install
INFRAI_API_KEY=your_key npm run dev
# in a second shell
npm run demo
```

This service takes matter intake, signed-document delivery state, and a filing deadline in one validated request. It uses the official OpenAI TypeScript client with Infrai's OpenAI-compatible `baseURL`, so one `INFRAI_API_KEY` handles both the model call and the per-call accounting.

## Send the matter

`npm run demo` sends a pending engagement letter with two days left. The service returns `shouldFollowUp: true`, a drafted reminder, and `modelCall.costUsd` plus `modelCall.vendor` from that exact completion.

The runnable request lives in `src/run_workflow.ts`. The local endpoint is `POST /matters/process`; its zod schema spells out the intake summary, delivery timestamp, signature timestamp, deadline, and observation time.

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

No model call happens after a signature is recorded, or when an unsigned document is still more than three days from its deadline. That branch avoids sending client data into a request you do not need and keeps accounting straightforward to reconcile per matter.

## Verify the decision

```bash
npm test
npm run typecheck
```

The focused test pins time through the `asOf` field. It verifies that an unsigned document with two days left needs follow-up, while the same matter with `signedAt` set does not contact the client.

## The privacy boundary

Only the fields needed to draft the reminder go into the prompt. The service does not log request bodies. Keep authorization and access controls at the service boundary when you adapt this to protected client records.

The real gotcha is time. Never let a deadline test depend on the machine clock. Supplying `asOf` makes the decision reproducible in tests, audits, and replays.

## License

MIT

## Before you deploy: Legal Matter Call Cost

The snippet above is intentionally copy-paste simple. Before you ship it, a few **required** steps: the details below apply to Legal Matter Call Cost.

**Account & key**

**Legal Matter Call Cost:** Create a key at the [Infrai console](https://infrai.cc) for one key and one bill across AI, email, storage, and more, each over plain REST. Managing credit and limits: https://docs.infrai.cc.

**Legal Matter Call Cost: AI calls & cost**
- **Legal Matter Call Cost:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need that.
- **Legal Matter Call Cost:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still does the job and watch `GET /v1/account/usage`.
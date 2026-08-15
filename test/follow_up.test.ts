import assert from "node:assert/strict";
import test from "node:test";
import { decideFollowUp, matterRequestSchema } from "../src/legal_workflow.js";

const baseMatter = matterRequestSchema.parse({
  matterId: "matter-1042",
  clientName: "Jordan Lee",
  intakeSummary: "Employment agreement review and signature coordination.",
  signedDocument: {
    title: "Engagement letter",
    deliveredAt: "2026-08-12T09:00:00.000Z",
    signedAt: null
  },
  deadlineAt: "2026-08-16T09:00:00.000Z",
  asOf: "2026-08-14T09:00:00.000Z"
});

test("requests a signature follow-up inside the three-day window", () => {
  assert.deepEqual(decideFollowUp(baseMatter), {
    shouldFollowUp: true,
    reason: "signature_due",
    daysRemaining: 2
  });
});

test("does not contact a client after the document is signed", () => {
  const signed = {
    ...baseMatter,
    signedDocument: { ...baseMatter.signedDocument, signedAt: "2026-08-13T10:00:00.000Z" }
  };
  assert.equal(decideFollowUp(signed).reason, "already_signed");
  assert.equal(decideFollowUp(signed).shouldFollowUp, false);
});

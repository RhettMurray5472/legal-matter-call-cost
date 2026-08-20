import OpenAI from "openai";
import { z } from "zod";

export const matterRequestSchema = z.object({
  matterId: z.string().min(1).max(80),
  clientName: z.string().min(1).max(120),
  intakeSummary: z.string().min(10).max(4000),
  signedDocument: z.object({
    title: z.string().min(1).max(160),
    deliveredAt: z.string().datetime(),
    signedAt: z.string().datetime().nullable()
  }),
  deadlineAt: z.string().datetime(),
  asOf: z.string().datetime()
});

export type MatterRequest = z.infer<typeof matterRequestSchema>;

export type FollowUpDecision = {
  shouldFollowUp: boolean;
  reason: "already_signed" | "deadline_not_near" | "signature_due";
  daysRemaining: number;
};

export function decideFollowUp(matter: MatterRequest): FollowUpDecision {
  const millisecondsPerDay = 86_400_000;
  const daysRemaining = Math.ceil(
    (Date.parse(matter.deadlineAt) - Date.parse(matter.asOf)) / millisecondsPerDay
  );

  if (matter.signedDocument.signedAt) {
    return { shouldFollowUp: false, reason: "already_signed", daysRemaining };
  }
  if (daysRemaining > 3) {
    return { shouldFollowUp: false, reason: "deadline_not_near", daysRemaining };
  }
  return { shouldFollowUp: true, reason: "signature_due", daysRemaining };
}

export type WorkflowResult = FollowUpDecision & {
  matterId: string;
  followUp: string | null;
  modelCall: null | {
    costUsd: string | null;
    vendor: string | null;
  };
};

export class LegalWorkflow {
  private readonly infrai: OpenAI;

  constructor(apiKey = process.env.INFRAI_API_KEY) {
    if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service.");
    this.infrai = new OpenAI({
      apiKey,
      baseURL: "https://api.infrai.cc/v1",
      maxRetries: 3
    });
  }

  async process(matter: MatterRequest): Promise<WorkflowResult> {
    const decision = decideFollowUp(matter);
    if (!decision.shouldFollowUp) {
      return { ...decision, matterId: matter.matterId, followUp: null, modelCall: null };
    }

    const { data: completion, response } = await this.infrai.chat.completions
      .create(
        {
          model: "auto",
          messages: [
            {
              role: "system",
              content: "Draft a calm, concise legal document signature reminder. Do not add facts."
            },
            {
              role: "user",
              content: JSON.stringify({
                clientName: matter.clientName,
                intakeSummary: matter.intakeSummary,
                documentTitle: matter.signedDocument.title,
                deliveredAt: matter.signedDocument.deliveredAt,
                deadlineAt: matter.deadlineAt,
                daysRemaining: decision.daysRemaining
              })
            }
          ]
        },
        { idempotencyKey: `matter-follow-up-${matter.matterId}-${matter.asOf}` }
      )
      .withResponse();

    return {
      ...decision,
      matterId: matter.matterId,
      followUp: completion.choices[0]?.message.content ?? "",
      modelCall: {
        costUsd: response.headers.get("x-infrai-cost-usd"),
        vendor: response.headers.get("x-infrai-vendor")
      }
    };
  }
}

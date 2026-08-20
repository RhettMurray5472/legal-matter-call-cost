const request = { matterId: "matter-1042", clientName: "Jordan Lee", intakeSummary: "Employment agreement review and signature coordination.", signedDocument: { title: "Engagement letter", deliveredAt: "2026-08-12T09:00:00.000Z", signedAt: null }, deadlineAt: "2026-08-16T09:00:00.000Z", asOf: "2026-08-14T09:00:00.000Z" };
const response = await fetch("http://localhost:3000/matters/process", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
console.log(JSON.stringify(await response.json(), null, 2));
export {};

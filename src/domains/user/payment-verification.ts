export type ConfirmedPaymentCandidate = {
  status: string;
  user_id: string;
  pack_id: string | null;
  plan_id: string | null;
};

export function isConfirmedPaymentForPurchase(
  payment: ConfirmedPaymentCandidate,
  userId: string,
  resource: { kind: "pack" | "premium"; id: string },
): boolean {
  if (payment.status !== "confirmed" || payment.user_id !== userId) return false;
  return resource.kind === "pack"
    ? payment.pack_id === resource.id
    : payment.plan_id === resource.id;
}

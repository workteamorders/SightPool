"use client";
import { USDG_POOL } from "@config/allowlist";
import { MOCK_WALLET } from "@/lib/pool/mock";
import { runShield } from "@/lib/pool/flow";
import { Row } from "@/components/ui/statement";
import { useApp } from "../app-context";
import { ActionFlow } from "../action-flow";

export function ShieldFlow() {
  const { client, screening } = useApp();
  return (
    <ActionFlow
      kind="shield"
      lead="Move mock USDG from your mock wallet into the allowlisted USDG pool. The deposit is screened first. In a real build the deposit is public on chain."
      to={{
        label: "Pool (allowlisted)",
        hint: "The only pool this interface targets. It cannot be changed.",
        placeholder: "",
        initial: USDG_POOL,
        validate: () => null,
        editable: false,
        reviewLabel: "Pool",
      }}
      available={(b) => b.publicBalance}
      availableLabel="Mock public balance"
      hasFee={false}
      extraReview={() => (
        <>
          <Row label="From" value="Mock wallet" />
          <Row label="Screening" value="Runs before the deposit. Deny or review stops it." />
          <Row label="Relayer fee" value="None documented for shield" />
        </>
      )}
      irreversible="I understand a shield is final once confirmed and the deposit is public on chain."
      pendingStages={["Screening the deposit (mock).", "Submitting the deposit (mock).", "Waiting for confirmation (mock)."]}
      run={async (amount, _to, outcome) => {
        const { result, screening: s } = await runShield(client, screening, { from: MOCK_WALLET, amount }, outcome);
        return result.ok ? { ok: true, item: result.item, screeningRef: s?.referenceId ?? null } : result;
      }}
    />
  );
}

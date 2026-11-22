"use client";
import { isMockShieldedAddress, newMockShieldedAddressLabel } from "./helpers";
import { newMockShieldedAddress } from "@/lib/pool/mock";
import { useApp } from "../app-context";
import { ActionFlow } from "../action-flow";

export function TransferFlow() {
  const { client } = useApp();
  return (
    <ActionFlow
      kind="transfer"
      lead="Send part of your mock shielded balance to another shielded address. In a real build the protocol's relayer builds the proof and sees the amount and recipient."
      to={{
        label: "Recipient shielded address",
        hint: "The real format is not documented by the protocol. The mock uses an obviously fake form: mock-shielded: followed by 40 hex characters.",
        placeholder: "mock-shielded:…",
        initial: "",
        validate: (s) => (!s.trim() ? "Enter a recipient." : isMockShieldedAddress(s) ? null : "Use the mock form mock-shielded: followed by 40 lowercase hex characters."),
        helpers: (set) => (
          <button type="button" className="link min-h-touch px-2 text-14" onClick={() => set(newMockShieldedAddress())}>
            {newMockShieldedAddressLabel}
          </button>
        ),
        editable: true,
        reviewLabel: "Recipient",
      }}
      available={(b) => b.shieldedBalance}
      availableLabel="Mock shielded balance"
      hasFee
      irreversible="I checked the recipient. A transfer is final once confirmed and cannot be sent back by this interface."
      pendingStages={["Building the proof (mock).", "Sending to the relayer (mock).", "Waiting for confirmation (mock)."]}
      empty={{ title: "Nothing shielded yet", body: "Shield some mock USDG first. Then you can transfer it here.", href: "/app/shield/", cta: "Shield mock USDG" }}
      run={(amount, to, outcome) => {
        client.setOutcome(outcome);
        return client.transfer({ to, amount });
      }}
    />
  );
}

"use client";
import { MOCK_WALLET } from "@/lib/pool/mock";
import { isEvmAddress } from "@/lib/format";
import { Row } from "@/components/ui/statement";
import { useApp } from "../app-context";
import { ActionFlow } from "../action-flow";

export function UnshieldFlow() {
  const { client } = useApp();
  return (
    <ActionFlow
      kind="unshield"
      lead="Withdraw mock shielded USDG to a public address. Check the address twice: in a real build a wrong address cannot be corrected."
      to={{
        label: "Public address to pay out to",
        hint: "A 0x address on Robinhood Chain. Defaults to your mock wallet, so the mock public balance goes up.",
        placeholder: "0x…",
        initial: MOCK_WALLET,
        validate: (s) => (!s.trim() ? "Enter an address." : isEvmAddress(s) ? null : "An address is 0x followed by 40 hex characters."),
        helpers: (set) => (
          <button type="button" className="link min-h-touch px-2 text-14" onClick={() => set(MOCK_WALLET)}>
            Use my mock wallet
          </button>
        ),
        editable: true,
        reviewLabel: "Pay out to",
      }}
      available={(b) => b.shieldedBalance}
      availableLabel="Mock shielded balance"
      hasFee
      extraReview={(_a, to) => <Row label="Is this your mock wallet?" value={to.toLowerCase() === MOCK_WALLET.toLowerCase() ? "Yes" : "No, an outside address"} />}
      irreversible="I checked the address character by character. An unshield is final once confirmed."
      pendingStages={["Building the proof (mock).", "Sending to the relayer (mock).", "Waiting for confirmation (mock)."]}
      empty={{ title: "Nothing shielded yet", body: "Shield some mock USDG first. Then you can unshield it here.", href: "/app/shield/", cta: "Shield mock USDG" }}
      run={(amount, to, outcome) => {
        client.setOutcome(outcome);
        return client.unshield({ to, amount });
      }}
    />
  );
}

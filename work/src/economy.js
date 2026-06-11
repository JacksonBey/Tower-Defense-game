// Reference: SYSTEM.md#Economy-Formatting
export const DENOMS = [
  { key: "crown", label: "C", value: 49 },
  { key: "slab", label: "S", value: 7 },
  { key: "bolt", label: "B", value: 1 }
];

export function toDenominations(amount) {
  let rest = Math.max(0, Math.floor(amount));
  return DENOMS.map((denom) => {
    const count = Math.floor(rest / denom.value);
    rest %= denom.value;
    return { ...denom, count };
  });
}

export function formatMoney(amount) {
  return toDenominations(amount).map((d) => `${d.count}${d.label}`).join(" ");
}

export function canAfford(balance, cost) {
  return balance >= cost;
}

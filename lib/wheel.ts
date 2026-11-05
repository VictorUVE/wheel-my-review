import { WHEEL_DATA, type WheelKey } from "@/data/wheel-data";

export type ReviewTone = "top" | "tip";

export type WheelSelection = {
  [Key in WheelKey]: string;
};

export type WheelLocks = {
  [Key in WheelKey]: boolean;
};

export const WHEEL_LABELS: Record<ReviewTone, Record<WheelKey, string>> = {
  top: {
    ruleta1: "Escenario",
    ruleta2: "Complicación",
    ruleta3: "Resolución",
  },
  tip: {
    ruleta1: "Reto",
    ruleta2: "Situación",
    ruleta3: "Recomendación",
  },
};

export const DEFAULT_LOCKS: WheelLocks = {
  ruleta1: false,
  ruleta2: false,
  ruleta3: false,
};

/**
 * Devuelve una opción aleatoria del conjunto de opciones recibido.
 */
export function getRandomItem<Item>(items: readonly Item[]): Item {
  return items[Math.floor(Math.random() * items.length)];
}

export function createRandomSelection(tone: ReviewTone): WheelSelection {
  return {
    ruleta1: getRandomItem(WHEEL_DATA[tone].ruleta1),
    ruleta2: getRandomItem(WHEEL_DATA[tone].ruleta2),
    ruleta3: getRandomItem(WHEEL_DATA[tone].ruleta3),
  };
}

export function rerollWheel(selection: WheelSelection, key: WheelKey, tone: ReviewTone): WheelSelection {
  return {
    ...selection,
    [key]: getRandomItem(WHEEL_DATA[tone][key]),
  };
}

export function rerollSelection(current: WheelSelection, locks: WheelLocks, tone: ReviewTone): WheelSelection {
  const fresh = createRandomSelection(tone);

  return {
    ruleta1: locks.ruleta1 ? current.ruleta1 : fresh.ruleta1,
    ruleta2: locks.ruleta2 ? current.ruleta2 : fresh.ruleta2,
    ruleta3: locks.ruleta3 ? current.ruleta3 : fresh.ruleta3,
  };
}

export function buildWheelSentence(selection: WheelSelection): string {
  return [selection.ruleta1, selection.ruleta2, selection.ruleta3].join(" ");
}

export function formatReviewText(texts: string[], tones: ReviewTone[]): string {
  const tops = texts.filter((_, index) => tones[index] === "top");
  const tips = texts.filter((_, index) => tones[index] === "tip");

  return [
    "TOPS",
    ...tops.map((text, index) => `${index + 1}. ${text}`),
    "",
    "TIPS",
    ...tips.map((text, index) => `${index + 1}. ${text}`),
  ].join("\n");
}

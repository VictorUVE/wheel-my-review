import { WHEEL_DATA, type WheelKey } from "@/data/wheel-data";

export type ReviewTone = "top" | "tip";

export type WheelSelection = {
  [Key in WheelKey]: string;
};

export type WheelLocks = {
  [Key in WheelKey]: boolean;
};

export const WHEEL_LABELS: Record<WheelKey, string> = {
  ruleta1: "Contexto",
  ruleta2: "Acción",
  ruleta3: "Situación",
  ruleta4: "Resolución",
};

export const DEFAULT_LOCKS: WheelLocks = {
  ruleta1: false,
  ruleta2: false,
  ruleta3: false,
  ruleta4: false,
};

/**
 * Devuelve una opción aleatoria.
 * En el caso del tipo de review ("top" o "tip"), se divide el array de opciones en dos mitades y se selecciona aleatoriamente de la mitad correspondiente.
 * Está un poco guarreado.
 */
export function getRandomItem<Item>(items: readonly Item[], tone?: ReviewTone): Item {
  const numberOptions = tone ? items.length / 2 : items.length;
  const delta = tone && tone === "tip" ? items.length / 2 : 0;
  return items[Math.floor(Math.random() * numberOptions) + delta];
}

export function createRandomSelection(tone: ReviewTone): WheelSelection {
  return {
    ruleta1: getRandomItem(WHEEL_DATA["ruleta1"]),
    ruleta2: getRandomItem(WHEEL_DATA["ruleta2"]),
    ruleta3: getRandomItem(WHEEL_DATA["ruleta3"]),
    ruleta4: getRandomItem(WHEEL_DATA["ruleta4"], tone),
  };
}

export function rerollWheel(selection: WheelSelection, key: WheelKey, tone: ReviewTone): WheelSelection {
  return {
    ...selection,
    [key]: getRandomItem(WHEEL_DATA[key], tone),
  };
}

export function rerollSelection(current: WheelSelection, locks: WheelLocks, tone: ReviewTone): WheelSelection {
  const fresh = createRandomSelection(tone);

  return {
    ruleta1: locks.ruleta1 ? current.ruleta1 : fresh.ruleta1,
    ruleta2: locks.ruleta2 ? current.ruleta2 : fresh.ruleta2,
    ruleta3: locks.ruleta3 ? current.ruleta3 : fresh.ruleta3,
    ruleta4: locks.ruleta4 ? current.ruleta4 : fresh.ruleta4,
  };
}

export function buildWheelSentence(selection: WheelSelection): string {
  return [selection.ruleta1, selection.ruleta2, selection.ruleta3, selection.ruleta4].join(" ");
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

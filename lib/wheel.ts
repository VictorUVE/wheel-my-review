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
  ruleta2: "Accion",
  ruleta3: "Situacion",
  ruleta4: "Resolucion",
};

const TOP_RESOLUTIONS = WHEEL_DATA.ruleta4.slice(0, 6);
const TIP_RESOLUTIONS = WHEEL_DATA.ruleta4.slice(6);

export const DEFAULT_LOCKS: WheelLocks = {
  ruleta1: false,
  ruleta2: false,
  ruleta3: false,
  ruleta4: false,
};

export function getRandomItem<Item>(items: readonly Item[]): Item {
  return items[Math.floor(Math.random() * items.length)];
}

function getResolutionPool(tone: ReviewTone) {
  return tone === "top" ? TOP_RESOLUTIONS : TIP_RESOLUTIONS;
}

export function getWheelOptions(key: WheelKey, tone: ReviewTone) {
  return key === "ruleta4" ? getResolutionPool(tone) : WHEEL_DATA[key];
}

export function createRandomSelection(tone: ReviewTone): WheelSelection {
  return {
    ruleta1: getRandomItem(getWheelOptions("ruleta1", tone)),
    ruleta2: getRandomItem(getWheelOptions("ruleta2", tone)),
    ruleta3: getRandomItem(getWheelOptions("ruleta3", tone)),
    ruleta4: getRandomItem(getWheelOptions("ruleta4", tone)),
  };
}

export function rerollWheel(selection: WheelSelection, key: WheelKey, tone: ReviewTone): WheelSelection {
  return {
    ...selection,
    [key]: getRandomItem(getWheelOptions(key, tone)),
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

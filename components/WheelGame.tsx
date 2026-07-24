"use client";

import { useEffect, useMemo, useState } from "react";

import FortuneWheel from "@/components/FortuneWheel";
import type { WheelKey } from "@/data/wheel-data";
import {
  WHEEL_LABELS,
  buildWheelSentence,
  createRandomSelection,
  formatReviewText,
  getWheelOptions,
  rerollWheel,
  type ReviewTone,
  type WheelSelection,
} from "@/lib/wheel";

type ReviewSlot = {
  id: string;
  title: string;
  tone: ReviewTone;
  selection: WheelSelection;
  text: string;
};

type ModalState = {
  slotId: string;
  tone: ReviewTone;
  title: string;
};

const SLOT_KEYS: WheelKey[] = ["ruleta1", "ruleta2", "ruleta3", "ruleta4"];

function createInitialSlots(): ReviewSlot[] {
  return [
    createReviewSlot("top-1", "Top 1", "top"),
    createReviewSlot("top-2", "Top 2", "top"),
    createReviewSlot("top-3", "Top 3", "top"),
    createReviewSlot("tip-1", "Tip 1", "tip"),
    createReviewSlot("tip-2", "Tip 2", "tip"),
    createReviewSlot("tip-3", "Tip 3", "tip"),
  ];
}

function createReviewSlot(id: string, title: string, tone: ReviewTone): ReviewSlot {
  const selection = createRandomSelection(tone);

  return {
    id,
    title,
    tone,
    selection,
    text: "",
  };
}

function getToneClasses(tone: ReviewTone) {
  return tone === "top"
    ? "border-emerald-300/70 bg-emerald-400/10 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.18)]"
    : "border-amber-300/70 bg-amber-400/10 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.16)]";
}

export default function WheelGame() {
  const [slots, setSlots] = useState<ReviewSlot[]>(() => createInitialSlots());
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [draftSelection, setDraftSelection] = useState<WheelSelection | null>(null);
  const [spinningKeys, setSpinningKeys] = useState<WheelKey[]>([]);
  const [wheelRotations, setWheelRotations] = useState<Record<WheelKey, number>>({
    ruleta1: 0,
    ruleta2: 0,
    ruleta3: 0,
    ruleta4: 0,
  });
  const [copied, setCopied] = useState(false);

  const reviewDraft = useMemo(
    () =>
      formatReviewText(
        slots.map(slot => slot.text),
        slots.map(slot => slot.tone),
      ),
    [slots],
  );
  const mailtoHref = useMemo(() => {
    const body = encodeURIComponent(reviewDraft);
    return `mailto:?subject=${encodeURIComponent("Wheel My Review")}&body=${body}`;
  }, [reviewDraft]);
  const topSlots = useMemo(() => slots.filter(slot => slot.tone === "top"), [slots]);
  const tipSlots = useMemo(() => slots.filter(slot => slot.tone === "tip"), [slots]);
  const isModalSpinning = spinningKeys.length > 0;

  useEffect(() => {
    if (!modalState) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalState]);

  function updateSlot(slotId: string, updater: (slot: ReviewSlot) => ReviewSlot) {
    setSlots(currentSlots => currentSlots.map(slot => (slot.id === slotId ? updater(slot) : slot)));
  }

  function handleOpenModal(slot: ReviewSlot) {
    setCopied(false);
    setModalState({ slotId: slot.id, tone: slot.tone, title: slot.title });
    setDraftSelection(slot.selection);
    setSpinningKeys([]);
    setWheelRotations({
      ruleta1: 0,
      ruleta2: 0,
      ruleta3: 0,
      ruleta4: 0,
    });
  }

  function handleCloseModal() {
    setModalState(null);
    setDraftSelection(null);
    setSpinningKeys([]);
  }

  function spinWheel(key: WheelKey) {
    if (!draftSelection || !modalState) {
      return;
    }

    setSpinningKeys(current => (current.includes(key) ? current : [...current, key]));
    setWheelRotations(current => ({
      ...current,
      [key]: current[key] + 1440 + Math.floor(Math.random() * 360),
    }));

    window.setTimeout(() => {
      setDraftSelection(current => {
        if (!current) {
          return current;
        }

        return rerollWheel(current, key, modalState.tone);
      });
      setSpinningKeys(current => current.filter(item => item !== key));
    }, 2200);
  }

  function handleSpinAll() {
    SLOT_KEYS.forEach((key, index) => {
      window.setTimeout(() => {
        spinWheel(key);
      }, index * 120);
    });
  }

  function handleUseResult() {
    if (!modalState || !draftSelection) {
      return;
    }

    setCopied(false);
    updateSlot(modalState.slotId, slot => ({
      ...slot,
      selection: draftSelection,
      text: buildWheelSentence(draftSelection),
    }));
    handleCloseModal();
  }

  function handleReset() {
    setCopied(false);
    handleCloseModal();
    setSlots(createInitialSlots());
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reviewDraft);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function handleSlotTextChange(slotId: string, text: string) {
    setCopied(false);
    updateSlot(slotId, slot => ({
      ...slot,
      text,
    }));
  }

  function renderSlotGroup(title: string, description: string, tone: ReviewTone, groupSlots: ReviewSlot[]) {
    return (
      <section className="rounded-4xl border border-white/10 bg-black/26 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p
              className={`text-xs font-black uppercase tracking-[0.3em] ${tone === "top" ? "text-emerald-200/80" : "text-amber-200/80"}`}
            >
              {title}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">{description}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/66">
            Cada campo abre una modal con cuatro ruedas. Puedes girarlas una a una o lanzar las cuatro de golpe.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {groupSlots.map(slot => (
            <article
              key={slot.id}
              className={`rounded-[1.75rem] border p-4 transition ${getToneClasses(slot.tone)} shadow-[0_18px_55px_rgba(0,0,0,0.18)]`}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">{slot.title}</p>
                  <p className="mt-1 text-sm text-white/74">
                    {slot.tone === "top" ? "Reconocimiento concreto" : "Mejora accionable"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenModal(slot)}
                  className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-white/18"
                >
                  Abrir ruletas
                </button>
              </div>

              <label className="block space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.26em] text-white/50">Texto final</span>
                <textarea
                  value={slot.text}
                  onChange={event => handleSlotTextChange(slot.id, event.target.value)}
                  rows={6}
                  className="min-h-40 w-full rounded-3xl border border-white/12 bg-black/22 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/28 focus:border-cyan-300/60 focus:bg-black/32"
                  placeholder={slot.tone === "top" ? "Genera un top con la ruleta" : "Genera un tip con la ruleta"}
                />
              </label>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.25),transparent_28%),radial-gradient(circle_at_bottom,rgba(244,63,94,0.18),transparent_35%),linear-gradient(180deg,#12071f_0%,#090111_42%,#05010a_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[34px_34px] opacity-30" />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col gap-8 rounded-4xl border border-white/10 bg-black/30 p-5 shadow-[0_25px_120px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex w-fit rounded-full border border-fuchsia-300/40 bg-fuchsia-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-100">
              Wheel My Review
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-white sm:text-5xl">
                Tragaperras de tops y tips
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
                Genera 3 tops y 3 tips desde una interfaz más dirigida. Cada resultado nace dentro de una modal con 4
                ruedas de la fortuna reutilizables y luego cae en su campo correspondiente.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white/84 transition hover:bg-white/14"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-2xl border border-emerald-300/45 bg-emerald-400/18 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-emerald-50 transition hover:bg-emerald-400/26"
            >
              {copied ? "Copiado" : "Copiar review"}
            </button>
          </div>
        </header>

        {renderSlotGroup("TOPS", "Tres reconocimientos con ruleta propia", "top", topSlots)}
        {renderSlotGroup("TIPS", "Tres mejoras con ruleta independiente", "tip", tipSlots)}

        <section className="rounded-[1.75rem] border border-white/12 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200/75">Salida final</p>
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">
                Bloque listo para compartir
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-white/68">
                Los seis campos ya son editables. Aquí solo se consolida el review completo para copiarlo o abrirlo en
                tu cliente de correo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-2xl border border-emerald-300/50 bg-emerald-400/18 px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-emerald-50 transition hover:bg-emerald-400/26"
              >
                {copied ? "Copiado" : "Copiar todo"}
              </button>
              <a
                href={mailtoHref}
                className="rounded-2xl border border-fuchsia-300/45 bg-fuchsia-400/14 px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-50 transition hover:bg-fuchsia-400/24"
              >
                Enviar
              </a>
            </div>
          </div>

          <textarea
            readOnly
            value={reviewDraft}
            rows={12}
            className="mt-6 min-h-64 w-full rounded-3xl border border-white/12 bg-white/6 px-4 py-4 text-sm leading-6 text-white outline-none"
          />
        </section>

        <footer className="grid gap-3 rounded-3xl border border-white/10 bg-white/6 p-4 text-sm text-white/68 md:grid-cols-3">
          <div>
            <p className="font-bold uppercase tracking-[0.22em] text-white/84">6 campos</p>
            <p>3 tops y 3 tips con generación separada para que cada texto salga cuando de verdad lo necesitas.</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-[0.22em] text-white/84">4 ruedas por modal</p>
            <p>Cada rueda tiene su propio botón y además existe un disparo conjunto para relanzar todo de una vez.</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-[0.22em] text-white/84">Salida editable</p>
            <p>
              El resultado se vuelca al campo activo y luego puede retocarse, copiarse o abrirse en mailto sin backend.
            </p>
          </div>
        </footer>
      </div>

      {modalState && draftSelection ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={handleCloseModal}
            className="absolute inset-0 bg-slate-950/78 backdrop-blur-sm"
          />

          <section className="relative z-10 max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-4xl border border-white/12 bg-[linear-gradient(180deg,rgba(9,12,24,0.98)_0%,rgba(12,5,22,0.96)_100%)] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/76">{modalState.title}</p>
                <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-white">
                  {modalState.tone === "top" ? "Generar top" : "Generar tip"}
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-white/66">
                  Gira las ruedas que quieras y usa el resultado cuando la combinación te convenza.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSpinAll}
                  className="rounded-2xl border border-rose-300/45 bg-linear-to-br from-rose-400 to-orange-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_10px_30px_rgba(251,113,133,0.38)] transition hover:-translate-y-0.5"
                  disabled={isModalSpinning}
                >
                  Girar las 4
                </button>
                <button
                  type="button"
                  onClick={handleUseResult}
                  className="rounded-2xl border border-emerald-300/45 bg-emerald-400/18 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-emerald-50 transition hover:bg-emerald-400/26"
                  disabled={isModalSpinning}
                >
                  Usar resultado
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white/84 transition hover:bg-white/14"
                  disabled={isModalSpinning}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {SLOT_KEYS.map(key => (
                <FortuneWheel
                  key={key}
                  title={WHEEL_LABELS[key]}
                  options={getWheelOptions(key, modalState.tone)}
                  selectedValue={draftSelection[key]}
                  rotation={wheelRotations[key]}
                  isSpinning={spinningKeys.includes(key)}
                  onSpin={() => spinWheel(key)}
                />
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-white/12 bg-white/6 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/52">Combinacion actual</p>
              <p className="mt-3 text-base leading-7 text-white/92">{buildWheelSentence(draftSelection)}</p>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

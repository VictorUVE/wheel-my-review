"use client";

import { useEffect, useMemo, useState } from "react";

import FortuneWheel from "@/components/FortuneWheel";
import styles from "@/components/WheelGame.module.scss";
import { WHEEL_DATA, type WheelKey } from "@/data/wheel-data";
import {
  WHEEL_LABELS,
  buildWheelSentence,
  createRandomSelection,
  formatReviewText,
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

const SLOT_KEYS: WheelKey[] = ["ruleta1", "ruleta2", "ruleta3"];

function createWheelRecord<T>(value: T): Record<WheelKey, T> {
  return {
    ruleta1: value,
    ruleta2: value,
    ruleta3: value,
  };
}

function getOptionIndex(options: readonly string[], value: string) {
  const index = options.indexOf(value);
  return index >= 0 ? index : 0;
}

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
  return tone === "top" ? styles.slotTop : styles.slotTip;
}

export default function WheelGame() {
  const [slots, setSlots] = useState<ReviewSlot[]>(() => createInitialSlots());
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [draftSelection, setDraftSelection] = useState<WheelSelection | null>(null);
  const [targetSelection, setTargetSelection] = useState<WheelSelection | null>(null);
  const [spinningKeys, setSpinningKeys] = useState<WheelKey[]>([]);
  const [wheelSpinIds, setWheelSpinIds] = useState<Record<WheelKey, number>>(() => createWheelRecord(0));
  const [wheelTargetIndexes, setWheelTargetIndexes] = useState<Record<WheelKey, number>>(() => createWheelRecord(0));
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
    setTargetSelection(slot.selection);
    setSpinningKeys([]);
    setWheelSpinIds(createWheelRecord(0));
    const wheelData = WHEEL_DATA[slot.tone];
    setWheelTargetIndexes({
      ruleta1: getOptionIndex(wheelData.ruleta1, slot.selection.ruleta1),
      ruleta2: getOptionIndex(wheelData.ruleta2, slot.selection.ruleta2),
      ruleta3: getOptionIndex(wheelData.ruleta3, slot.selection.ruleta3),
    });
  }

  function handleCloseModal() {
    setModalState(null);
    setDraftSelection(null);
    setTargetSelection(null);
    setSpinningKeys([]);
  }

  function spinWheel(key: WheelKey) {
    if (!draftSelection || !targetSelection || !modalState || spinningKeys.includes(key)) {
      return;
    }

    setSpinningKeys(current => (current.includes(key) ? current : [...current, key]));

    const nextSelection = rerollWheel(targetSelection, key, modalState.tone);
    const nextValue = nextSelection[key];
    const wheelData = WHEEL_DATA[modalState.tone];

    setTargetSelection(nextSelection);
    setWheelTargetIndexes(current => ({
      ...current,
      [key]: getOptionIndex(wheelData[key], nextValue),
    }));
    setWheelSpinIds(current => ({
      ...current,
      [key]: current[key] + 1,
    }));
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

  function handleWheelSpinEnd(key: WheelKey, selectedIndex: number) {
    if (!modalState) {
      return;
    }

    const selectedValue = WHEEL_DATA[modalState.tone][key][selectedIndex];

    if (!selectedValue) {
      return;
    }

    setDraftSelection(current => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: selectedValue,
      };
    });
    setSpinningKeys(current => current.filter(item => item !== key));
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
      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <div>
            <h2 className={styles.groupTitle}>{description}</h2>
          </div>
        </div>

        <div className={styles.slotGrid}>
          {groupSlots.map(slot => (
            <article key={slot.id} className={`${styles.slotCard} ${getToneClasses(slot.tone)}`}>
              <div className={styles.slotHeader}>
                <div>
                  <p className={styles.slotLabel}>{slot.title}</p>
                </div>
                <button type="button" onClick={() => handleOpenModal(slot)} className={styles.ghostButton}>
                  Wheel it!
                </button>
              </div>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  {slot.tone === "top" ? "Tu top personalizado" : "Tu tip personalizado"}
                </span>
                <textarea
                  value={slot.text}
                  onChange={event => handleSlotTextChange(slot.id, event.target.value)}
                  rows={4}
                  className={styles.textarea}
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
    <section className={styles.page}>
      <div className={styles.backgroundGlow} />
      <div className={styles.backgroundGrid} />

      <div className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.hero}>
            <span className={styles.badge}>Tips & Tops Generator</span>
            <div className={styles.heroBlock}>
              <h1 className={styles.heroTitle}>Wheel My Review</h1>
              <p className={styles.heroText}>
                ¿Has escrito tantas reviews que ya no sabes qué contar de tus compis?
                <br />
                Este alucinante <i lang="en">generator</i> es lo que necesitas.
                <br />
                ¿Necesitas un top? Wheel it!
                <br />
                ¿Necesitas un tip? Wheel it!
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button type="button" onClick={handleReset} className={styles.button}>
              Reset
            </button>
            <button type="button" onClick={handleCopy} className={`${styles.button} ${styles.copyButton}`}>
              {copied ? "Copiado" : "Copiar review"}
            </button>
          </div>
        </header>

        {renderSlotGroup("Tops", "¡Que rueden los tops!", "top", topSlots)}
        {renderSlotGroup("Tips", "¡Gira esos tips!", "tip", tipSlots)}

        <section className={styles.summary}>
          <div className={styles.summaryHeader}>
            <div>
              <p className={styles.summaryEyebrow}>Salida final</p>
              <h2 className={styles.summaryTitle}>Bloque listo para compartir</h2>
              <p className={styles.summaryText}>
                Los seis campos ya son editables. Aquí solo se consolida el review completo para copiarlo o abrirlo en
                tu cliente de correo.
              </p>
            </div>

            <div className={styles.summaryActions}>
              <button type="button" onClick={handleCopy} className={`${styles.button} ${styles.copyButton}`}>
                {copied ? "Copiado" : "Copiar todo"}
              </button>
              <a href={mailtoHref} className={styles.linkButton}>
                Enviar
              </a>
            </div>
          </div>

          <textarea readOnly value={reviewDraft} rows={12} className={styles.reviewOutput} />
        </section>
      </div>

      {modalState && draftSelection ? (
        <div className={styles.modal}>
          <button type="button" aria-label="Cerrar modal" onClick={handleCloseModal} className={styles.modalOverlay} />

          <section className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>{modalState.title}</p>
                <h2 className={styles.modalTitle}>{modalState.tone === "top" ? "Generar top" : "Generar tip"}</h2>
                <p className={styles.modalText}>
                  Gira las ruedas que quieras y usa el resultado cuando la combinación te convenza.
                </p>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={handleSpinAll}
                  className={styles.primaryButton}
                  disabled={isModalSpinning}
                >
                  Girar las 3
                </button>
                <button
                  type="button"
                  onClick={handleUseResult}
                  className={`${styles.button} ${styles.copyButton}`}
                  disabled={isModalSpinning}
                >
                  Usar resultado
                </button>
                <button type="button" onClick={handleCloseModal} className={styles.button} disabled={isModalSpinning}>
                  Cerrar
                </button>
              </div>
            </div>

            <div className={styles.wheelGrid}>
              {SLOT_KEYS.map(key => (
                <FortuneWheel
                  key={key}
                  title={WHEEL_LABELS[modalState.tone][key]}
                  options={WHEEL_DATA[modalState.tone][key]}
                  spinId={wheelSpinIds[key]}
                  selectedIndex={getOptionIndex(WHEEL_DATA[modalState.tone][key], draftSelection[key])}
                  targetSelectedIndex={wheelTargetIndexes[key]}
                  isSpinning={spinningKeys.includes(key)}
                  onSpin={() => spinWheel(key)}
                  onSpinEnd={selectedIndex => handleWheelSpinEnd(key, selectedIndex)}
                />
              ))}
            </div>

            <div className={styles.currentSelection}>
              <p className={styles.currentSelectionLabel}>Combinacion actual</p>
              <p className={styles.currentSelectionText}>{buildWheelSentence(draftSelection)}</p>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

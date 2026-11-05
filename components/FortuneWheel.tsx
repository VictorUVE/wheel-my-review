import { useEffect, useRef } from "react";

import styles from "@/components/FortuneWheel.module.scss";

const POINTER_ANGLE = 90;

type FortuneWheelProps = {
  title: string;
  options: readonly string[];
  spinId: number;
  selectedIndex: number;
  targetSelectedIndex: number;
  isSpinning: boolean;
  onSpin: () => void;
  onSpinEnd: (selectedIndex: number) => void;
};

export default function FortuneWheel({
  title,
  options,
  spinId,
  selectedIndex,
  targetSelectedIndex,
  isSpinning,
  onSpin,
  onSpinEnd,
}: FortuneWheelProps) {
  const wheelRef = useRef<HTMLUListElement | null>(null);
  const hubTextRef = useRef<HTMLSpanElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const onSpinEndRef = useRef(onSpinEnd);
  const lastProcessedSpinIdRef = useRef<number>(spinId);
  const accumulatedRotationRef = useRef<number>(0);
  const hasInitializedRotationRef = useRef(false);

  useEffect(() => {
    onSpinEndRef.current = onSpinEnd;
  }, [onSpinEnd]);

  useEffect(() => {
    const wheelElement = wheelRef.current;
    const optionCount = options.length;

    if (!wheelElement || optionCount === 0 || hasInitializedRotationRef.current) {
      return;
    }

    const degreesPerItem = 360 / optionCount;
    const initialRotation = POINTER_ANGLE - selectedIndex * degreesPerItem;

    accumulatedRotationRef.current = initialRotation;
    wheelElement.style.transform = `rotate(${initialRotation}deg)`;
    hasInitializedRotationRef.current = true;
  }, [options.length, selectedIndex]);

  useEffect(() => {
    const wheelElement = wheelRef.current;
    const hubTextElement = hubTextRef.current;
    const optionCount = options.length;

    if (!wheelElement || !hubTextElement || optionCount === 0) {
      return;
    }

    if (spinId === lastProcessedSpinIdRef.current) {
      return;
    }

    if (targetSelectedIndex < 0 || targetSelectedIndex >= optionCount) {
      return;
    }

    const degreesPerItem = 360 / optionCount;
    const segmentReferenceAngle = targetSelectedIndex * degreesPerItem;
    const normalizedCurrentRotation = ((accumulatedRotationRef.current % 360) + 360) % 360;
    const normalizedTargetRotation =
      (((POINTER_ANGLE - segmentReferenceAngle) % 360) + 360) % 360;
    const extraTurns = 5 * 360;
    const deltaRotation = ((normalizedTargetRotation - normalizedCurrentRotation + 360) % 360) + extraTurns;
    const nextRotation = accumulatedRotationRef.current + deltaRotation;

    animationRef.current?.cancel();
    hubTextElement.classList.add(styles.hubTextSpinning);

    const animation = wheelElement.animate(
      [{ transform: `rotate(${accumulatedRotationRef.current}deg)` }, { transform: `rotate(${nextRotation}deg)` }],
      {
        duration: 4000,
        easing: "cubic-bezier(0.440, -0.205, 0.000, 1.130)",
        fill: "forwards",
        iterations: 1,
        direction: "normal",
      },
    );

    animationRef.current = animation;
    lastProcessedSpinIdRef.current = spinId;

    animation.onfinish = () => {
      accumulatedRotationRef.current = nextRotation;
      hubTextElement.classList.remove(styles.hubTextSpinning);
      onSpinEndRef.current(targetSelectedIndex);
    };

    animation.oncancel = () => {
      hubTextElement.classList.remove(styles.hubTextSpinning);
    };

    return () => {
      animation.onfinish = null;
      animation.oncancel = null;
    };
  }, [options.length, spinId, targetSelectedIndex]);

  useEffect(() => {
    const hubTextElement = hubTextRef.current;

    return () => {
      hubTextElement?.classList.remove(styles.hubTextSpinning);
      animationRef.current?.cancel();
    };
  }, []);

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{isSpinning ? "" : (options[selectedIndex] ?? "")}</p>
        </div>

        <button type="button" onClick={onSpin} className={styles.spinButton}>
          Girar
        </button>
      </div>

      <div className={styles.shell}>
        <ul className={styles.wheel} ref={wheelRef}>
          {options.map((option, index) => {
            return (
              <li key={`${title}-${option}`} className={styles.segment}>
                <span
                  className={`${styles.segmentLabel} ${
                    !isSpinning && index === selectedIndex ? styles.segmentLabelSelected : ""
                  }`}
                >
                  {option}
                </span>
              </li>
            );
          })}
        </ul>
        <div className={styles.hub} onClick={onSpin}>
          <span ref={hubTextRef} className={styles.hubText}>
            ¡Dale!
          </span>
        </div>
      </div>
    </section>
  );
}

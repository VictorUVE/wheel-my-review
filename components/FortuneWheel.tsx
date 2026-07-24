type FortuneWheelProps = {
  title: string;
  options: readonly string[];
  selectedValue: string;
  rotation: number;
  isSpinning: boolean;
  onSpin: () => void;
};

function buildWheelBackground(segmentCount: number) {
  const palette = ["#fb7185", "#f97316", "#facc15", "#2dd4bf", "#38bdf8", "#a78bfa", "#f472b6", "#34d399"];
  const degreeStep = 360 / segmentCount;

  return `conic-gradient(${Array.from({ length: segmentCount }, (_, index) => {
    const start = index * degreeStep;
    const end = start + degreeStep;
    return `${palette[index % palette.length]} ${start}deg ${end}deg`;
  }).join(", ")})`;
}

export default function FortuneWheel({
  title,
  options,
  selectedValue,
  rotation,
  isSpinning,
  onSpin,
}: FortuneWheelProps) {
  const segmentCount = options.length;
  const degreeStep = 360 / segmentCount;
  const selectedIndex = Math.max(options.indexOf(selectedValue), 0);

  return (
    <section className="rounded-4xl border border-white/12 bg-white/6 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/70">{title}</p>
          <p className="mt-2 text-sm leading-6 text-white/72">{selectedValue}</p>
        </div>

        <button
          type="button"
          onClick={onSpin}
          className="rounded-full border border-cyan-200/40 bg-cyan-300/14 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-50 transition hover:bg-cyan-300/24"
        >
          Girar
        </button>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-64">
        <div className="absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-x-14 border-b-22 border-x-transparent border-b-amber-300 drop-shadow-[0_6px_18px_rgba(251,191,36,0.5)]" />
        <div
          className="absolute inset-0 rounded-full border-10 border-white/14 shadow-[inset_0_0_0_8px_rgba(255,255,255,0.06),0_20px_45px_rgba(0,0,0,0.35)] transition-transform duration-2200 ease-[cubic-bezier(0.18,0.88,0.18,1)]"
          style={{
            transform: `rotate(${rotation}deg)`,
            backgroundImage: buildWheelBackground(segmentCount),
          }}
        >
          <div className="absolute inset-[14%] rounded-full bg-slate-950/78 ring-1 ring-white/10" />

          {options.map((option, index) => {
            const angle = degreeStep * index + degreeStep / 2;
            const isSelected = index === selectedIndex;

            return (
              <div
                key={`${title}-${option}`}
                className="absolute left-1/2 top-1/2 w-[38%] origin-left -translate-y-1/2"
                style={{ transform: `rotate(${angle - 90}deg)` }}
              >
                <span
                  className={`block -translate-y-1/2 rounded-full px-3 py-1 text-[10px] font-black uppercase leading-tight tracking-[0.08em] text-slate-950 transition ${isSelected ? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.45)]" : "bg-white/72"}`}
                >
                  {option}
                </span>
              </div>
            );
          })}

          <div className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-slate-950/92 shadow-[0_0_25px_rgba(0,0,0,0.45)]">
            <span
              className={`text-[10px] font-black uppercase tracking-[0.26em] text-white ${isSpinning ? "animate-pulse" : ""}`}
            >
              Spin
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

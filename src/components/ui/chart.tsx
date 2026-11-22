/**
 * Small bar chart. Title states the conclusion, axes carry units, every bar has a tooltip (title) and the
 * data is repeated as text for screen readers. Single hue plus value labels, so it reads the same with color blindness.
 */
export function BarChart({ title, unit, data, sample }: { title: string; unit: string; data: { label: string; value: number }[]; sample?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 320;
  const H = 120;
  const pad = { l: 28, b: 20, t: 8 };
  const bw = (W - pad.l) / Math.max(1, data.length);
  const summary = data.map((d) => `${d.label}: ${d.value} ${unit}`).join(", ");
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-14 font-medium">{title}</span>
        {sample && <span className="eyebrow">Sample data</span>}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${summary}`} className="h-auto w-full">
        <line x1={pad.l} y1={H - pad.b} x2={W} y2={H - pad.b} stroke="var(--line-strong)" />
        <text x={0} y={pad.t + 8} fontSize="9" fill="var(--text-faint)">
          {max}
        </text>
        <text x={0} y={H - pad.b} fontSize="9" fill="var(--text-faint)">
          0
        </text>
        <text x={0} y={H - 4} fontSize="9" fill="var(--text-faint)">
          {unit}
        </text>
        {data.map((d, i) => {
          const h = ((H - pad.b - pad.t) * d.value) / max;
          const x = pad.l + i * bw + bw * 0.2;
          return (
            <g key={d.label}>
              <rect x={x} y={H - pad.b - h} width={bw * 0.6} height={Math.max(h, d.value ? 1 : 0)} fill="var(--text-muted)">
                <title>{`${d.label}: ${d.value} ${unit}`}</title>
              </rect>
              <text x={x + bw * 0.3} y={H - 6} fontSize="9" fill="var(--text-faint)" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="sr-only">{summary}</p>
    </figure>
  );
}

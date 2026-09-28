import { DocSection } from "../_components/doc";
import { principles } from "../_data";

export function PrinciplesSection() {
  return (
    <DocSection
      index={1}
      title="Principles"
      description="From the research notes. Every screen gets checked against these."
      contentClassName="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3"
    >
      {principles.map((p, i) => (
        <div key={p.title} className="rounded-card bg-surface p-5">
          <span
            data-tint={p.tint}
            className="mb-3.5 inline-grid size-8 place-items-center rounded-control bg-tint-bg text-small font-semibold text-tint"
          >
            {i + 1}
          </span>
          <div className="font-semibold tracking-[-0.005em]">{p.title}</div>
          <p className="mt-1.5 mb-0 text-small text-pretty text-text-2">{p.body}</p>
        </div>
      ))}
    </DocSection>
  );
}

// Small building blocks shared by the Foundations stories.
// Chrome (labels, borders, cards) uses Theme tokens only.
import type { ReactNode } from 'react'

export function Page({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <h1 className="display text-fg-neutral">{title}</h1>
      {intro && <p className="body-medium mt-2 max-w-2xl text-fg-neutral-subtle">{intro}</p>}
      <div className="mt-10 flex flex-col gap-12">{children}</div>
    </div>
  )
}

export function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="heading-small text-fg-neutral">{title}</h2>
      {note && <p className="body-small mt-1 max-w-2xl text-fg-neutral-subtle">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-xs bg-neutral px-1 py-px font-mono text-[0.9em] text-fg-neutral">{children}</code>
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-0.5 rounded-lg bg-neutral p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={
              'label rounded-md px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-focus-accent ' +
              (active ? 'bg-card-neutral text-fg-neutral shadow-xs' : 'text-fg-neutral-subtle hover:bg-ghost-neutral-hover')
            }
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

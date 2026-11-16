import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { themeGroups, type ThemeToken } from './tokens-data'
import { checker } from './checker'
import { Code, Page, Section, Segmented } from './ui'

type Mode = 'light' | 'dark'

const scopeInfo: Record<string, { title: string; note: string }> = {
  surface: { title: 'Surface', note: 'Window canvas and modal backdrop. No prominence or states.' },
  bg: {
    title: 'Background (bg)',
    note: 'Backgrounds of controls and plates. Roles: neutral, accent, success, warning, danger. Prominence subtle / normal / emphasized, each with hover and pressed.',
  },
  card: { title: 'Card', note: 'Neutral only. Emphasized is the top layer: menus and popovers.' },
  form: { title: 'Form', note: 'Fills of inputs, checkboxes and radios. Neutral only: default / hover / pressed.' },
  ghost: { title: 'Ghost', note: 'Transparent controls. No default state: hover / pressed / active.' },
  fg: { title: 'Foreground (fg)', note: 'Text and icons. Normal and subtle tiers plus one on-emphasized per role.' },
  stroke: { title: 'Stroke', note: 'Boundaries and dividers. Emphasized is functional (3:1), subtle and normal are decorative.' },
  focus: { title: 'Focus', note: 'Keyboard focus indicator. Accent and danger only, plus a subtle halo.' },
}

/** What the token looks like in use. */
function Sample({ scope, token }: { scope: string; token: ThemeToken }) {
  const v = `var(${token.cssVar})`
  const box = 'h-14 w-full rounded-md'
  if (scope === 'fg') {
    const onEmphasized = token.cssVar.includes('on-emphasized')
    return (
      <div
        className={`${box} flex items-center justify-center body-large-semibold`}
        style={{ color: v, background: onEmphasized ? `var(--bg-${token.cssVar.slice(2).split('-')[1]}-emphasized)` : 'var(--card-neutral)' }}
      >
        Aa
      </div>
    )
  }
  if (scope === 'stroke') {
    return <div className={box} style={{ border: `2px solid ${v}`, background: 'var(--card-neutral)' }} />
  }
  if (scope === 'focus') {
    return (
      <div className="flex h-14 items-center justify-center rounded-md" style={{ background: 'var(--card-neutral)' }}>
        <div
          className="h-8 w-24 rounded-md"
          style={{ background: 'var(--form-neutral)', boxShadow: `0 0 0 2px var(--card-neutral), 0 0 0 4px ${v}` }}
        />
      </div>
    )
  }
  // bg, card, form, ghost, surface: translucent fills need a checkerboard underneath
  return (
    <div className={`${box} overflow-hidden border border-stroke-neutral-subtle`} style={checker}>
      <div className="h-full w-full" style={{ background: v }} />
    </div>
  )
}

function Colors() {
  const [mode, setMode] = useState<Mode>('light')
  return (
    <div className={mode === 'dark' ? 'dark' : undefined} style={{ background: 'var(--surface)', color: 'var(--fg-neutral)', minHeight: '100vh' }}>
      <Page
        title="Theme colors"
        intro={
          <>
            Semantic tokens. Components read only these. Name formula: <Code>scope / role / [prominence] / [context] / [state]</Code>. Switch the mode to see
            how every token is re-pointed to a different Palette value.
          </>
        }
      >
        <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between border-b border-stroke-neutral-subtle bg-surface px-6 py-3 md:-mx-10 md:px-10">
          <span className="label text-fg-neutral-subtle">Mode</span>
          <Segmented
            label="Theme mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </div>

        {themeGroups.map((g) => (
          <Section key={g.scope} title={scopeInfo[g.scope]?.title ?? g.scope} note={scopeInfo[g.scope]?.note}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
              {g.tokens.map((t) => {
                const cur = mode === 'dark' ? t.dark : t.light
                return (
                  <div key={t.cssVar} className="flex flex-col gap-2 rounded-lg border border-stroke-neutral-subtle bg-card-neutral p-2">
                    <Sample scope={g.scope} token={t} />
                    <div className="px-1 pb-1">
                      <div className="label-small break-all text-fg-neutral">{t.cssVar}</div>
                      <div className="caption mt-0.5 break-all text-fg-neutral-subtle">{t.twClass}</div>
                      <div className="caption mt-1 text-fg-neutral-subtle">
                        {cur.ref}
                        {cur.opacity !== null && <span> · {cur.opacity}%</span>}
                        {cur.hex && <span> · {cur.hex}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>
        ))}
      </Page>
    </div>
  )
}

const meta = {
  title: 'Foundations/Colors',
  component: Colors,
  parameters: { themeLocal: true },
} satisfies Meta<typeof Colors>
export default meta

export const Theme: StoryObj<typeof meta> = { name: 'Theme (Light / Dark)' }

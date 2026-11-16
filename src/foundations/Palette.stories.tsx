import type { Meta, StoryObj } from '@storybook/react-vite'
import { paletteGroups } from './tokens-data'
import { Page, Section } from './ui'

// This is documentation of raw values. Components never use these directly:
// they read Theme tokens (see Foundations / Colors).

function Palette() {
  return (
    <Page
      title="Palette"
      intro={
        <>
          Raw Tailwind v4 colors. Values only, no meaning. <strong>Never use these in components</strong>: pick a Theme token instead.
        </>
      }
    >
      {paletteGroups.map((g) => (
        <Section key={g.hue} title={g.hue === 'base' ? 'Base' : g.hue}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
            {g.steps.map((s) => (
              <div key={s.cssVar} className="flex flex-col gap-1.5">
                <div className="h-14 rounded-md border border-stroke-neutral-subtle" style={{ background: `var(${s.cssVar})` }} title={s.cssVar} />
                <div>
                  <div className="label-small text-fg-neutral">{s.step}</div>
                  <div className="caption text-fg-neutral-subtle">{s.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </Page>
  )
}

const meta = { title: 'Foundations/Palette', component: Palette } satisfies Meta<typeof Palette>
export default meta

export const AllColors: StoryObj<typeof meta> = { name: 'All colors' }

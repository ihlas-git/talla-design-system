import type { Meta, StoryObj } from '@storybook/react-vite'
import { alphaTokens, paletteGroups } from './tokens-data'
import { checker } from './checker'
import { Code, Page, Section } from './ui'

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

      <Section
        title="Alpha (translucent)"
        note={
          <>
            Figma cannot store alias + opacity, so translucent colors are separate Palette variables. Their Code syntax is a <Code>color-mix(...)</Code>{' '}
            expression, which Theme tokens use directly. Only combinations that Theme needs exist.
          </>
        }
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
          {alphaTokens.map((a) => (
            <div key={a.path} className="flex flex-col gap-1.5">
              <div className="h-14 overflow-hidden rounded-md border border-stroke-neutral-subtle" style={checker}>
                <div className="h-full w-full" style={{ background: a.expression }} title={a.expression} />
              </div>
              <div>
                <div className="label-small text-fg-neutral">{a.path.replace('.', ' / ')}</div>
                <div className="caption text-fg-neutral-subtle">{a.hex8}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </Page>
  )
}

const meta = { title: 'Foundations/Palette', component: Palette } satisfies Meta<typeof Palette>
export default meta

export const AllColors: StoryObj<typeof meta> = { name: 'All colors' }

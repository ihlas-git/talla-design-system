import type { Meta, StoryObj } from '@storybook/react-vite'
import { borderWidthTokens, sizeTokens, spacingTokens } from './tokens-data'
import { Code, Page, Section } from './ui'

function Spacing() {
  return (
    <Page
      title="Spacing"
      intro={
        <>
          One 4px step: <Code>--spacing: 0.25rem</Code>. Every spacing token is a multiple of it, so <Code>p-4</Code>, <Code>gap-2</Code>, <Code>mt-6</Code> and
          so on use these values.
        </>
      }
    >
      <Section title="Spacing scale">
        <div className="overflow-hidden rounded-lg border border-stroke-neutral-subtle bg-card-neutral">
          {spacingTokens.map((t, i) => (
            <div
              key={t.name}
              className={'grid grid-cols-[88px_72px_1fr] items-center gap-3 px-4 py-2 ' + (i > 0 ? 'border-t border-stroke-neutral-subtle' : '')}
            >
              <span className="label-small text-fg-neutral">{t.label}</span>
              <span className="caption text-fg-neutral-subtle">{t.px}px</span>
              <div className="min-w-0">
                <div className="h-3 rounded-xs bg-accent-emphasized" style={{ width: Math.max(t.px, 1), maxWidth: '100%' }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Border width">
        <div className="flex flex-wrap gap-4">
          {borderWidthTokens.map((t) => (
            <div key={t.name} className="flex flex-col items-start gap-2">
              <div className="h-14 w-24 rounded-md bg-card-neutral" style={{ border: `${t.px}px solid var(--stroke-neutral-emphasized)` }} />
              <span className="label-small text-fg-neutral">
                border-{t.name} <span className="caption text-fg-neutral-subtle">· {t.px}px</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Container sizes" note="Maximum widths for layout containers (max-w-*).">
        <div className="overflow-hidden rounded-lg border border-stroke-neutral-subtle bg-card-neutral">
          {sizeTokens.map((t, i) => (
            <div
              key={t.name}
              className={'grid grid-cols-[88px_72px_1fr] items-center gap-3 px-4 py-2 ' + (i > 0 ? 'border-t border-stroke-neutral-subtle' : '')}
            >
              <span className="label-small text-fg-neutral">{t.name}</span>
              <span className="caption text-fg-neutral-subtle">{t.px}px</span>
              <div className="min-w-0">
                <div className="h-3 rounded-xs bg-neutral-emphasized" style={{ width: `${(t.px / 1280) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </Page>
  )
}

const meta = { title: 'Foundations/Spacing', component: Spacing } satisfies Meta<typeof Spacing>
export default meta

export const Scale: StoryObj<typeof meta> = {}

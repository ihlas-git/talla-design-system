import type { Meta, StoryObj } from '@storybook/react-vite'
import { textStyles } from './tokens-data'
import { Code, Page, Section } from './ui'

const sample = 'Candidates move through the pipeline'

function Typography() {
  const groups = Object.entries(
    textStyles.reduce<Record<string, typeof textStyles>>((acc, s) => {
      const k = s.cls.split('-')[0]
      ;(acc[k] ??= []).push(s)
      return acc
    }, {}),
  )
  return (
    <Page
      title="Typography"
      intro={
        <>
          Inter. Each text style is a CSS class (<Code>.heading-large</Code>, <Code>.body-small</Code> ...) driven by Typography variables. Desktop values by
          default; below 768px the Mobile values apply. Use the viewport tool in the toolbar to see it change.
        </>
      }
    >
      {groups.map(([group, styles]) => (
        <Section key={group} title={group[0].toUpperCase() + group.slice(1)}>
          <div className="overflow-hidden rounded-lg border border-stroke-neutral-subtle bg-card-neutral">
            {styles.map((s, i) => (
              <div
                key={s.cls}
                className={'grid gap-x-6 gap-y-2 p-4 md:grid-cols-[220px_1fr] ' + (i > 0 ? 'border-t border-stroke-neutral-subtle' : '')}
              >
                <div>
                  <div className="label text-fg-neutral">.{s.cls}</div>
                  <div className="caption mt-0.5 text-fg-neutral-subtle">
                    {s.weight}
                    {s.underline ? ' · underline' : ''}
                  </div>
                  <div className="caption mt-1 text-fg-neutral-subtle">
                    Desktop {s.desktop.size}/{s.desktop.line} · {s.desktop.spacing}px
                  </div>
                  <div className="caption text-fg-neutral-subtle">
                    Mobile {s.mobile.size}/{s.mobile.line} · {s.mobile.spacing}px
                  </div>
                </div>
                <div className={`${s.cls} text-fg-neutral`}>{sample}</div>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </Page>
  )
}

const meta = { title: 'Foundations/Typography', component: Typography } satisfies Meta<typeof Typography>
export default meta

export const TextStyles: StoryObj<typeof meta> = { name: 'Text styles' }

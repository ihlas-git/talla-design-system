import type { Meta, StoryObj } from '@storybook/react-vite'
import { shadowTokens } from './tokens-data'
import { Page } from './ui'

function Shadows() {
  return (
    <Page title="Shadows" intro="Effect styles Shadow/2xs ... 2xl from Figma, exported as --shadow-* variables. Classes: shadow-2xs ... shadow-2xl. Shadows are not color tokens.">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-8 rounded-xl bg-surface p-8">
        {shadowTokens.map((t) => (
          <div key={t.name} className="flex flex-col gap-3">
            <div className="h-24 rounded-lg bg-card-neutral" style={{ boxShadow: `var(${t.cssVar})` }} />
            <div>
              <div className="label-small text-fg-neutral">shadow-{t.name}</div>
              <div className="caption text-fg-neutral-subtle">{t.cssVar}</div>
              {t.layers.map((l) => (
                <div key={l} className="caption text-fg-neutral-subtle">
                  {l}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}

const meta = { title: 'Foundations/Shadows', component: Shadows } satisfies Meta<typeof Shadows>
export default meta

export const Elevation: StoryObj<typeof meta> = {}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { radiusTokens } from './tokens-data'
import { Page } from './ui'

function Radius() {
  return (
    <Page title="Radius" intro="Corner radii. Classes: rounded-xs, rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-3xl, rounded-4xl, rounded-none, rounded-full.">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
        {radiusTokens.map((t) => (
          <div key={t.name} className="flex flex-col gap-2">
            <div
              className="h-24 border border-stroke-neutral-emphasized bg-neutral"
              style={{ borderRadius: t.name === 'full' ? '9999px' : `${t.px}px` }}
            />
            <div>
              <div className="label-small text-fg-neutral">rounded-{t.name}</div>
              <div className="caption text-fg-neutral-subtle">{t.name === 'full' ? 'full (pill)' : `${t.px}px`}</div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}

const meta = { title: 'Foundations/Radius', component: Radius } satisfies Meta<typeof Radius>
export default meta

export const Scale: StoryObj<typeof meta> = {}

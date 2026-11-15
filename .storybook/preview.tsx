import type { Decorator, Preview } from '@storybook/react-vite'
import '../src/fonts.ts'
import '../src/index.css'

/**
 * Global Light / Dark switch (toolbar). Adding the `dark` class to a wrapper re-points
 * every Theme variable (see `.dark` in src/styles/tokens.css).
 * Stories with `parameters.themeLocal` have their own switch and are left alone.
 */
const withTheme: Decorator = (Story, context) => {
  if (context.parameters.themeLocal) return <Story />
  const dark = context.globals.theme === 'dark'
  return (
    <div className={dark ? 'dark' : undefined} style={{ background: 'var(--surface)', color: 'var(--fg-neutral)', minHeight: '100vh' }}>
      <Story />
    </div>
  )
}

const preview: Preview = {
  decorators: [withTheme],
  initialGlobals: { theme: 'light' },
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
    options: {
      storySort: { order: ['Foundations', ['Colors', 'Palette', 'Typography', 'Spacing', 'Radius', 'Shadows']] },
    },
  },
}

export default preview

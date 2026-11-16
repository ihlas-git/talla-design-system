// Reads the same Figma snapshot that generates src/styles/tokens.css,
// so the Foundations pages can never drift from the real tokens.
import snapshot from '../../tokens/figma-snapshot.json'

type Raw = { path: string; cs: string; type: string; modes: Record<string, string | number | { ref: string; opacity: number }> }
const snap = snapshot as unknown as {
  palette: Raw[]
  numbers: Raw[]
  typography: Raw[]
  theme: Raw[]
  shadows: Record<string, number[][]>
  textStyles: { name: string; weight: string; underline: boolean }[]
}

/** `var(--x)` -> `--x`, otherwise null. */
export const cssVar = (cs: string) => cs.match(/^var\((--[a-z0-9-]+)\)$/)?.[1] ?? null

// ---------------------------------------------------------------- Palette
export type PaletteStep = { step: string; cssVar: string; hex: string }
export type PaletteGroup = { hue: string; steps: PaletteStep[] }

export const paletteGroups: PaletteGroup[] = (() => {
  const groups = new Map<string, PaletteStep[]>()
  for (const t of snap.palette) {
    const name = cssVar(t.cs)
    if (!name) continue
    const [hue, step] = t.path.includes('.') ? t.path.split('.') : ['base', t.path]
    if (!groups.has(hue)) groups.set(hue, [])
    groups.get(hue)!.push({ step, cssVar: name, hex: String(t.modes.Value).toUpperCase() })
  }
  // Same order as the Figma page: base, neutrals, then colors.
  const order = [
    'base', 'slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe',
    'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky',
    'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  ]
  const at = (h: string) => (order.includes(h) ? order.indexOf(h) : order.length)
  return [...groups].sort((a, b) => at(a[0]) - at(b[0])).map(([hue, steps]) => ({ hue, steps }))
})()

const paletteByRef = new Map(snap.palette.map((t) => [`{palette.${t.path}}`, t]))
const refLabel = (ref: string) => ref.replace('{palette.', '').replace('}', '').replace(/\./g, '/')

// ---------------------------------------------------------------- Theme
export type ThemeToken = {
  cssVar: string
  /** Tailwind class that reads this token. */
  twClass: string
  light: { ref: string; opacity: number | null; hex: string }
  dark: { ref: string; opacity: number | null; hex: string }
}
export type ThemeGroup = { scope: string; tokens: ThemeToken[] }

const twClass = (name: string) => {
  const n = name.slice(2)
  const [scope, ...rest] = n.split('-')
  const tail = rest.join('-')
  if (scope === 'bg') return `bg-${tail}`
  if (scope === 'fg') return `text-${n}`
  if (scope === 'stroke') return `border-${n}`
  if (scope === 'focus') return `ring-${n}`
  return `bg-${n}`
}

const resolve = (t: Raw, mode: 'Light' | 'Dark') => {
  const raw = t.modes[mode]
  const ref = typeof raw === 'object' ? raw.ref : String(raw)
  const opacity = typeof raw === 'object' ? raw.opacity : null
  const p = paletteByRef.get(ref)
  return { ref: refLabel(ref), opacity, hex: p ? String(p.modes.Value).toUpperCase() : '' }
}

const scopeOrder = ['surface', 'bg', 'card', 'form', 'ghost', 'fg', 'stroke', 'focus']
const roleOrder = ['neutral', 'accent', 'success', 'warning', 'danger']
const stateOrder = ['hover', 'pressed', 'active']
const rank = (name: string) => {
  const parts = name.slice(2).split('-')
  const rest = parts.slice(2)
  return [
    scopeOrder.indexOf(parts[0]),
    roleOrder.indexOf(parts[1]),
    rest.includes('subtle') ? 0 : rest.includes('on') ? 3 : rest.includes('emphasized') ? 2 : 1,
    stateOrder.findIndex((s) => rest.includes(s)) + 1,
  ]
}

export const themeGroups: ThemeGroup[] = (() => {
  const tokens = snap.theme
    .map((t) => ({ t, name: cssVar(t.cs)! }))
    .sort((a, b) => {
      const ra = rank(a.name)
      const rb = rank(b.name)
      for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]
      return a.name.localeCompare(b.name)
    })
  const groups = new Map<string, ThemeToken[]>()
  for (const { t, name } of tokens) {
    const scope = name.slice(2).split('-')[0]
    if (!groups.has(scope)) groups.set(scope, [])
    groups.get(scope)!.push({ cssVar: name, twClass: twClass(name), light: resolve(t, 'Light'), dark: resolve(t, 'Dark') })
  }
  return [...groups].map(([scope, tokens]) => ({ scope, tokens }))
})()

// ---------------------------------------------------------------- Numbers
const px = (v: unknown) => `${Number(Number(v).toFixed(2))}px`

export type NumberToken = { name: string; cssVar: string | null; px: number }
const numbersWhere = (prefix: string): NumberToken[] =>
  snap.numbers
    .filter((t) => t.path.startsWith(prefix))
    .map((t) => ({ name: t.path.slice(prefix.length), cssVar: cssVar(t.cs), px: Number(t.modes.Value) }))

export const spacingTokens = numbersWhere('spacing.')
  .map((t) => ({ ...t, label: t.name.replace('-', '.') }))
  .sort((a, b) => a.px - b.px)
export const radiusTokens = numbersWhere('radius.').sort((a, b) => a.px - b.px)
export const borderWidthTokens = numbersWhere('border.width.').sort((a, b) => a.px - b.px)
export const sizeTokens = numbersWhere('size.').sort((a, b) => a.px - b.px)

// ---------------------------------------------------------------- Shadows
export const shadowTokens = Object.entries(snap.shadows).map(([name, layers]) => ({
  name,
  cssVar: `--shadow-${name}`,
  layers: layers.map(([x, y, blur, spread, alpha]) => `${px(x)} ${px(y)} ${px(blur)} ${px(spread)} · ${Math.round(alpha * 100)}%`),
}))

// ---------------------------------------------------------------- Typography
export type TextStyleDoc = {
  cls: string
  figmaName: string
  weight: string
  underline: boolean
  desktop: { size: number; line: number; spacing: number }
  mobile: { size: number; line: number; spacing: number }
}
const typo = new Map(snap.typography.map((t) => [cssVar(t.cs)!, t]))
const weightName: Record<string, string> = { normal: 'Regular 400', medium: 'Medium 500', semibold: 'Semi Bold 600', bold: 'Bold 700' }

export const textStyles: TextStyleDoc[] = snap.textStyles.map((s) => {
  const cls = s.name
    .split('/')
    .filter((p, i, a) => p !== a[i - 1])
    .join('-')
  const get = (what: string, mode: 'Desktop' | 'Mobile') => Number(typo.get(`--${cls}-${what}`)!.modes[mode])
  const at = (mode: 'Desktop' | 'Mobile') => ({
    size: get('font-size', mode),
    line: get('line-height', mode),
    spacing: Number(get('letter-spacing', mode).toFixed(2)),
  })
  return {
    cls,
    figmaName: s.name,
    weight: weightName[s.weight.replace('--font-weight-', '')],
    underline: s.underline,
    desktop: at('Desktop'),
    mobile: at('Mobile'),
  }
})

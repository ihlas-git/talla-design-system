// Builds src/styles/tokens.css and src/styles/tailwind-theme.css
// from tokens/figma-snapshot.json (a snapshot of the Figma file "Talla").
//
// Names are taken strictly from each variable's Code syntax (WEB) in Figma.
// Run: npm run tokens
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const snap = JSON.parse(fs.readFileSync(path.join(root, 'tokens/figma-snapshot.json'), 'utf8'))

const fail = (msg) => {
  console.error('build-tokens: ' + msg)
  process.exit(1)
}

// ---------- helpers ----------
/** `var(--x)` -> `--x`, otherwise null (the Code syntax is an expression, not a name). */
const varName = (cs) => cs.match(/^var\((--[a-z0-9-]+)\)$/)?.[1] ?? null

/** Number -> short string without float noise (-0.36000001 -> -0.36). */
const num = (n) => String(Number(n.toFixed(4)))
const rem = (px) => (px === 0 ? '0' : `${num(px / 16)}rem`)
const px = (n) => (n === 0 ? '0' : `${num(n)}px`)
const hex = (h) => h.toLowerCase()

const out = []
const line = (s = '') => out.push(s)

// ---------- Palette ----------
const paletteByRef = new Map() // "{palette.blue.100}" -> Code syntax value
for (const t of snap.palette) paletteByRef.set(`{palette.${t.path}}`, t.cs)

// Same order as the Figma page: base, neutrals, then colors (steps keep their 50..950 order).
const hueOrder = [
  'white', 'black', 'slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]
const hueRank = (t) => {
  const i = hueOrder.indexOf(t.path.split('.')[0])
  return i === -1 ? hueOrder.length : i
}
const paletteNamed = snap.palette
  .filter((t) => varName(t.cs))
  .map((t, i) => ({ t, i }))
  .sort((a, b) => hueRank(a.t) - hueRank(b.t) || a.i - b.i)
  .map(({ t }) => t)
const paletteAlpha = snap.palette.filter((t) => !varName(t.cs))

// ---------- Number value ----------
const numberLines = []
const skippedNumbers = []
let spacingBase = null
for (const t of snap.numbers) {
  const value = t.modes.Value
  const m = t.cs.match(/^calc\(var\(--spacing\) \* ([0-9.]+)\)$/)
  if (m) {
    const k = Number(m[1])
    if (k > 0) {
      const base = value / k
      if (spacingBase === null) spacingBase = base
      if (Math.abs(base - spacingBase) > 1e-6) fail(`spacing ${t.path} breaks the base step`)
    }
    continue // expressed through --spacing
  }
  const name = varName(t.cs)
  if (!name) {
    skippedNumbers.push(`${t.path} (${t.cs})`)
    continue
  }
  let v
  if (name === '--spacing-px') v = px(value)
  else if (name.startsWith('--font-weight-')) v = String(value)
  else if (name.endsWith('--letter-spacing')) v = px(value)
  else v = rem(value)
  numberLines.push([name, v, t.path])
}
if (spacingBase === null) fail('could not derive --spacing')

// ---------- Shadows ----------
const shadowLines = Object.entries(snap.shadows).map(([k, layers]) => [
  `--shadow-${k}`,
  layers.map(([x, y, b, s, a]) => `${px(x)} ${px(y)} ${px(b)} ${px(s)} rgb(0 0 0 / ${a})`).join(', '),
])

// ---------- Typography ----------
const typoNames = new Set(snap.typography.map((t) => varName(t.cs)))
const typoDesktop = []
const typoMobile = []
for (const t of snap.typography) {
  const name = varName(t.cs)
  const fmt = (v) => {
    if (typeof v === 'string') return v
    if (name.endsWith('letter-spacing')) return px(v)
    return rem(v)
  }
  const d = t.modes.Desktop
  const m = t.modes.Mobile
  if (name === '--font-sans') {
    // Figma stores only the family name; fallbacks are added for safety.
    typoDesktop.push([name, `"${d}", ui-sans-serif, system-ui, sans-serif`])
    continue
  }
  typoDesktop.push([name, fmt(d)])
  if (d !== m) typoMobile.push([name, fmt(m)])
}

// ---------- Theme ----------
const scopeRank = ['surface', 'bg', 'card', 'form', 'ghost', 'fg', 'stroke', 'focus']
const roleRank = ['neutral', 'accent', 'success', 'warning', 'danger']
const stateRank = ['hover', 'pressed', 'active']
const rank = (cssVar) => {
  const parts = cssVar.slice(2).split('-')
  const scope = scopeRank.indexOf(parts[0])
  const role = roleRank.indexOf(parts[1])
  const rest = parts.slice(2)
  const state = stateRank.findIndex((s) => rest.includes(s)) + 1
  const prom = rest.includes('subtle') ? 0 : rest.includes('on') ? 3 : rest.includes('emphasized') ? 2 : 1
  return [scope, role, prom, state]
}
const themeTokens = snap.theme
  .map((t) => ({ ...t, name: varName(t.cs) }))
  .sort((a, b) => {
    const ra = rank(a.name)
    const rb = rank(b.name)
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]
    return a.name.localeCompare(b.name)
  })
const resolveTheme = (t, mode) => {
  const ref = t.modes[mode]
  const v = paletteByRef.get(ref)
  if (!v) fail(`${t.path} (${mode}) points to an unknown palette token: ${ref}`)
  return v
}

// ---------- Text styles ----------
const textClasses = snap.textStyles.map((s) => {
  const parts = s.name.split('/').filter((p, i, a) => p !== a[i - 1])
  const cls = parts.join('-')
  const need = ['font-size', 'line-height', 'letter-spacing'].map((x) => `--${cls}-${x}`)
  for (const n of need) if (!typoNames.has(n)) fail(`text style ${s.name} needs missing variable ${n}`)
  return { ...s, cls }
})

// =====================================================================
// tokens.css
// =====================================================================
line('/*')
line(' * GENERATED FILE. Do not edit by hand.')
line(` * Source: Figma file "${snap.source.file}" (${snap.source.fileKey}), snapshot ${snap.source.exportedAt.slice(0, 10)}.`)
line(' * Rebuild: npm run tokens')
line(' *')
line(' * Variable names come strictly from Code syntax (WEB) of the Figma variables.')
line(' * Palette + Number value  -> @theme')
line(' * Theme Light             -> :root,  Theme Dark -> .dark')
line(' * Typography Desktop      -> :root,  Typography Mobile -> @media (max-width: 767px)')
line(' * Text styles             -> CSS classes (.heading-large, .body-small ...)')
line(' * Effect styles           -> --shadow-*')
line(' *')
line(' * Components use Theme tokens only. Palette values are never used directly.')
line(' */')
line()
line('/* `static` keeps every variable in the output, even ones no class uses yet. */')
line('@theme static {')
line('  /* Remove Tailwind default colors: only the Talla palette exists. */')
line('  --color-*: initial;')
line()
line('  /* ===== Palette ===== */')
let lastGroup = ''
for (const t of paletteNamed) {
  const group = t.path.split('.')[0]
  if (group !== lastGroup) {
    if (lastGroup) line()
    lastGroup = group
  }
  line(`  ${varName(t.cs)}: ${hex(t.modes.Value)};`)
}
line()
line('  /* ===== Number value ===== */')
line(`  --spacing: ${rem(spacingBase)};`)
let lastNs = ''
for (const [name, v] of numberLines) {
  const ns = name.replace(/^--/, '').split('-')[0]
  if (ns !== lastNs) {
    line()
    lastNs = ns
  }
  line(`  ${name}: ${v};`)
}
line()
line('  /* ===== Shadows (Effect styles Shadow/...) ===== */')
for (const [name, v] of shadowLines) line(`  ${name}: ${v};`)
line('}')
line()
line('/* ===== Theme: Light (default) + Typography: Desktop ===== */')
line(':root {')
line('  color-scheme: light;')
line()
let lastScope = ''
for (const t of themeTokens) {
  const scope = t.name.slice(2).split('-')[0]
  if (scope !== lastScope) {
    if (lastScope) line()
    lastScope = scope
  }
  line(`  ${t.name}: ${resolveTheme(t, 'Light')};`)
}
line()
line('  /* Typography: Desktop */')
for (const [name, v] of typoDesktop) line(`  ${name}: ${v};`)
line('}')
line()
line('/* ===== Theme: Dark ===== */')
line('.dark {')
line('  color-scheme: dark;')
line()
lastScope = ''
for (const t of themeTokens) {
  const scope = t.name.slice(2).split('-')[0]
  if (scope !== lastScope) {
    if (lastScope) line()
    lastScope = scope
  }
  line(`  ${t.name}: ${resolveTheme(t, 'Dark')};`)
}
line('}')
line()
line('/* ===== Typography: Mobile (only values that differ from Desktop) ===== */')
line('@media (max-width: 767px) {')
line('  :root {')
for (const [name, v] of typoMobile) line(`    ${name}: ${v};`)
line('  }')
line('}')
line()
line('/* ===== Text styles as classes ===== */')
line('/* In a layer, so Tailwind utilities (e.g. text-fg-neutral) can still combine with them. */')
line('@layer components {')
textClasses.forEach((s, i) => {
  line(`  .${s.cls} {`)
  line('    font-family: var(--font-sans);')
  line(`    font-size: var(--${s.cls}-font-size);`)
  line(`    font-weight: var(${s.weight});`)
  line(`    line-height: var(--${s.cls}-line-height);`)
  line(`    letter-spacing: var(--${s.cls}-letter-spacing);`)
  if (s.underline) line('    text-decoration-line: underline;')
  line('  }')
  if (i < textClasses.length - 1) line()
})
line('}')
fs.writeFileSync(path.join(root, 'src/styles/tokens.css'), out.join('\n') + '\n')

// =====================================================================
// tailwind-theme.css  (connects Theme tokens to Tailwind utilities)
// =====================================================================
// bg-*  tokens: --bg-accent-emphasized -> --color-accent-emphasized -> class bg-accent-emphasized
// others keep their scope: --fg-neutral-subtle -> --color-fg-neutral-subtle -> class text-fg-neutral-subtle
const twName = (cssVar) => {
  const n = cssVar.slice(2)
  return n.startsWith('bg-') ? `--color-${n.slice(3)}` : `--color-${n}`
}
const seen = new Map()
const tw = []
const tl = (s = '') => tw.push(s)
tl('/*')
tl(' * GENERATED FILE. Do not edit by hand. Rebuild: npm run tokens')
tl(' *')
tl(' * Connects Theme tokens to Tailwind. Utilities read the CSS variable at runtime,')
tl(' * so adding the `dark` class to <html> switches the whole palette.')
tl(' *')
tl(' *   --bg-accent-emphasized  ->  bg-accent-emphasized')
tl(' *   --fg-neutral-subtle     ->  text-fg-neutral-subtle')
tl(' *   --stroke-neutral        ->  border-stroke-neutral')
tl(' *   --focus-accent          ->  ring-focus-accent / outline-focus-accent')
tl(' *   --card-neutral          ->  bg-card-neutral')
tl(' */')
tl()
tl('@custom-variant dark (&:where(.dark, .dark *));')
tl()
tl('@theme inline {')
lastScope = ''
for (const t of themeTokens) {
  const scope = t.name.slice(2).split('-')[0]
  if (scope !== lastScope) {
    if (lastScope) tl()
    lastScope = scope
  }
  const key = twName(t.name)
  if (seen.has(key)) fail(`Tailwind name clash: ${key} (${seen.get(key)} and ${t.name})`)
  seen.set(key, t.name)
  tl(`  ${key}: var(${t.name});`)
}
tl('}')
fs.writeFileSync(path.join(root, 'src/styles/tailwind-theme.css'), tw.join('\n') + '\n')

console.log(
  `tokens.css: palette ${paletteNamed.length} (+${paletteAlpha.length} alpha used inline by Theme), ` +
    `numbers ${numberLines.length + 1}, shadows ${shadowLines.length}, ` +
    `theme ${themeTokens.length} x2 modes, typography ${typoDesktop.length} (mobile overrides ${typoMobile.length}), ` +
    `text classes ${textClasses.length}`,
)
if (skippedNumbers.length) console.log('not declared (Code syntax is a literal, Tailwind default is identical):', skippedNumbers.join(', '))

// Builds the single file src/styles/tokens.css (values + the Tailwind mapping)
// from tokens/figma-snapshot.json (a snapshot of the Figma file "Talla").
//
// CSS variable names are computed from the real Figma variable name (the `path` field), never from
// Code syntax. The `cs` field (Code syntax) is only cross-checked: a mismatch prints a warning and
// the computed name wins. Run: npm run tokens
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
const warnings = []
/** Compare the computed name with the Code syntax (`var(--x)`); warn on mismatch, never fail. */
const check = (t, name, expectedCs = `var(${name})`) => {
  if (t.cs !== expectedCs) warnings.push(`${t.path}: computed ${expectedCs}, Code syntax says ${t.cs}`)
  return name
}
/** Drop the repeated last segment: bg.accent.emphasized.emphasized -> bg.accent.emphasized */
const dropDupLeaf = (parts) => (parts.length > 1 && parts.at(-1) === parts.at(-2) ? parts.slice(0, -1) : parts)
/** Drop any consecutive repeat: body.large.large.font-size -> body.large.font-size */
const dropDups = (parts) => parts.filter((p, i, a) => p !== a[i - 1])

const paletteName = (t) => check(t, '--color-' + t.path.split('.').join('-'))
const themeName = (t) => check(t, '--' + dropDupLeaf(t.path.split('.')).join('-'))
// Typography: one explicit exception, the family variable is exposed as Tailwind's --font-sans.
const typoName = (t) =>
  check(t, t.path === 'font.family' ? '--font-sans' : '--' + dropDups(t.path.split('.')).join('-'))
// Number value: Tailwind namespaces differ from the Figma groups, so the mapping is a rule table.
// null = not declared (Code syntax is a literal and the Tailwind default is identical).
const numberName = (t) => {
  const [group, kind, ...rest] = t.path.split('.')
  if (group === 'border' || (group === 'radius' && (kind === 'full' || kind === 'none'))) return null
  if (group === 'spacing') return kind === 'px' ? check(t, '--spacing-px') : undefined // undefined = calc(--spacing * N)
  if (group === 'radius') return check(t, `--radius-${kind}`)
  if (group === 'size') return check(t, `--container-${kind}`)
  if (group === 'font') {
    const size = rest[0]
    const names = {
      size: `--text-${size}`,
      'line-height': `--text-${size}--line-height`,
      'letter-spacing': `--text-${size}--letter-spacing`,
      weight: `--font-weight-${size}`,
    }
    if (names[kind]) return check(t, names[kind])
  }
  warnings.push(`${t.path}: no naming rule, skipped`)
  return null
}

/** Number -> short string without float noise (-0.36000001 -> -0.36). */
const num = (n) => String(Number(n.toFixed(4)))
const rem = (px) => (px === 0 ? '0' : `${num(px / 16)}rem`)
const px = (n) => (n === 0 ? '0' : `${num(n)}px`)
const hex = (h) => h.toLowerCase()

const out = []
const line = (s = '') => out.push(s)

// ---------- Palette ----------
const paletteByRef = new Map() // "{palette.blue.100}" -> Code syntax value
for (const t of snap.palette) paletteByRef.set(`{palette.${t.path}}`, `var(${paletteName(t)})`)

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
  .map((t, i) => ({ t, i }))
  .sort((a, b) => hueRank(a.t) - hueRank(b.t) || a.i - b.i)
  .map(({ t }) => t)

// ---------- Number value ----------
const numberLines = []
const skippedNumbers = []
let spacingBase = null
for (const t of snap.numbers) {
  const value = t.modes.Value
  const name = numberName(t)
  if (name === undefined) {
    // spacing.N: the multiplier comes from the name itself (spacing.1-5 -> 1.5)
    const k = Number(t.path.split('.')[1].replace('-', '.'))
    check(t, null, `calc(var(--spacing) * ${k})`)
    if (k > 0) {
      const base = value / k
      if (spacingBase === null) spacingBase = base
      if (Math.abs(base - spacingBase) > 1e-6) fail(`spacing ${t.path} breaks the base step`)
    }
    continue // expressed through --spacing
  }
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
const typoNames = new Set(snap.typography.map(typoName))
const typoDesktop = []
const typoMobile = []
for (const t of snap.typography) {
  const name = typoName(t)
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
  .map((t) => ({ ...t, name: themeName(t) }))
  .sort((a, b) => {
    const ra = rank(a.name)
    const rb = rank(b.name)
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]
    return a.name.localeCompare(b.name)
  })
// A mode value is either a plain alias "{palette.x.y}" or { ref, opacity } (opacity in %, set on the
// Theme variable's fill in Figma). Translucent values become color-mix over the same Palette variable.
const resolveTheme = (t, mode) => {
  const raw = t.modes[mode]
  const ref = typeof raw === 'string' ? raw : raw?.ref
  const v = paletteByRef.get(ref)
  if (!v) fail(`${t.path} (${mode}) points to an unknown palette token: ${ref}`)
  if (typeof raw === 'string') return v
  const o = Number(raw.opacity)
  if (!(o >= 0 && o <= 100)) fail(`${t.path} (${mode}) has an invalid opacity: ${raw.opacity}`)
  return o === 100 ? v : `color-mix(in oklab, ${v} ${num(o)}%, transparent)`
}

// ---------- Text styles ----------
const textClasses = snap.textStyles.map((s) => {
  const parts = s.name.split('/').filter((p, i, a) => p !== a[i - 1])
  const cls = parts.join('-')
  const need = ['font-size', 'line-height', 'letter-spacing'].map((x) => `--${cls}-${x}`)
  for (const n of need) if (!typoNames.has(n)) fail(`text style ${s.name} needs missing variable ${n}`)
  return { ...s, cls }
})

// Tailwind name of a Theme token. bg-* tokens drop their scope, the others keep it:
//   --bg-accent-emphasized -> --color-accent-emphasized -> class bg-accent-emphasized
//   --fg-neutral-subtle    -> --color-fg-neutral-subtle -> class text-fg-neutral-subtle
const twName = (cssVar) => {
  const n = cssVar.slice(2)
  return n.startsWith('bg-') ? `--color-${n.slice(3)}` : `--color-${n}`
}

// =====================================================================
// tokens.css  (the only generated CSS file)
// =====================================================================
line('/*')
line(' * GENERATED FILE. Do not edit by hand.')
line(` * Source: Figma file "${snap.source.file}" (${snap.source.fileKey}), snapshot ${snap.source.exportedAt.slice(0, 10)}.`)
line(' * Rebuild: npm run tokens')
line(' *')
line(' * Variable names are computed from the Figma variable names (Code syntax is only cross-checked).')
line(' * Palette + Number value  -> @theme static (every variable stays in the output)')
line(' * Color: Theme Light      -> :root,  Theme Dark -> .dark')
line(' * Theme -> Tailwind        -> @theme inline (--bg-accent-emphasized -> class bg-accent-emphasized)')
line(' * Typography Desktop      -> :root,  Typography Mobile -> @media (max-width: 767px)')
line(' * Text styles             -> CSS classes (.heading-large, .body-small ...)')
line(' * Effect styles           -> --shadow-*')
line(' *')
line(' * Components use Theme tokens only. Palette values are never used directly.')
line(' */')
line()
line('/* Dark mode is the `.dark` class on <html>. */')
line('@custom-variant dark (&:where(.dark, .dark *));')
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
  line(`  ${paletteName(t)}: ${hex(t.modes.Value)};`)
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
line('/* ===== Color: Theme Light (default) ===== */')
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
line('}')
line()
line('/* ===== Color: Theme Dark ===== */')
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
line('/* ===== Theme -> Tailwind classes ===== */')
line('/* `inline` keeps var(--bg-...) in utilities, so the `.dark` class switches every color at runtime. */')
line('@theme inline {')
const seen = new Map()
lastScope = ''
for (const t of themeTokens) {
  const scope = t.name.slice(2).split('-')[0]
  if (scope !== lastScope) {
    if (lastScope) line()
    lastScope = scope
  }
  const key = twName(t.name)
  if (seen.has(key)) fail(`Tailwind name clash: ${key} (${seen.get(key)} and ${t.name})`)
  seen.set(key, t.name)
  line(`  ${key}: var(${t.name});`)
}
line('}')
line()
line('/* ===== Typography: Desktop (default) ===== */')
line(':root {')
for (const [name, v] of typoDesktop) line(`  ${name}: ${v};`)
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

console.log(
  `tokens.css: palette ${paletteNamed.length} ` +
    `numbers ${numberLines.length + 1}, shadows ${shadowLines.length}, ` +
    `theme ${themeTokens.length} x2 modes, typography ${typoDesktop.length} (mobile overrides ${typoMobile.length}), ` +
    `text classes ${textClasses.length}`,
)
if (warnings.length) console.warn(`build-tokens: ${warnings.length} Code syntax warning(s):\n  ` + [...new Set(warnings)].join('\n  '))
if (skippedNumbers.length) console.log('not declared (Code syntax is a literal, Tailwind default is identical):', skippedNumbers.join(', '))

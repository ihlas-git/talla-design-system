// Fails if component code uses Palette colors or color literals.
// Rule (see CLAUDE.md): components use Theme tokens only.
// Run: npm run check:tokens
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')

// Where Palette values are allowed: generated tokens and the Foundations docs.
const allowed = ['src/styles/', 'src/foundations/']

const hues =
  'slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const utilities =
  'bg|text|border|border-[xytblrse]|ring|ring-offset|outline|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow|placeholder'

const rules = [
  { name: 'Palette class (e.g. bg-blue-600)', re: new RegExp(`\\b(?:${utilities})-(?:${hues})-\\d{2,3}(?:-\\d+)?\\b`) },
  { name: 'white/black class (e.g. bg-white)', re: new RegExp(`\\b(?:${utilities})-(?:white|black)\\b`) },
  { name: 'Palette variable (var(--color-...))', re: /var\(--color-[a-z]+(?:-\d+)?\)/ },
  { name: 'hex color', re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b(?![\w-])/ },
  { name: 'color function (rgb/hsl/oklch/...)', re: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/ },
  { name: 'dark: color override', re: /\bdark:(?:bg|text|border|ring|outline|fill|stroke)-/ },
]

const files = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(tsx?|css|mdx)$/.test(e.name)) files.push(p)
  }
}
walk(srcDir)

let problems = 0
for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join('/')
  if (allowed.some((a) => rel.startsWith(a))) continue
  fs.readFileSync(file, 'utf8')
    .split('\n')
    .forEach((text, i) => {
      for (const r of rules) {
        const m = text.match(r.re)
        if (m) {
          problems++
          console.error(`${rel}:${i + 1}  ${r.name}: ${m[0]}`)
        }
      }
    })
}

if (problems) {
  console.error(`\n${problems} problem(s). Use Theme tokens (bg-accent-emphasized, text-fg-neutral ...). See CLAUDE.md.`)
  process.exit(1)
}
console.log(`check:tokens OK (${files.length} files scanned)`)

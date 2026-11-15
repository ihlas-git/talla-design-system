# Talla design system: rules for Claude and contributors

Talla is the design system of an ATS (hiring) web app. Stack: React, TypeScript, Vite, Tailwind CSS v4, Storybook.
Source of truth for tokens is the Figma file **Talla** (`gaLKdkheoiIoheOPNkCmi6`), page **Token convention**. These rules are that page, written for code.

## The main rule

**Components use Theme tokens only.**

- Never use a Palette color in a component: no `bg-blue-600`, `text-slate-500`, `border-zinc-200`, `bg-white`, `text-black`.
- Never write a color literal: no `#2563eb`, `rgb(...)`, `hsl(...)`, `oklch(...)`, no `bg-[#fff]`, no `bg-[var(--color-blue-600)]`.
- Never recolor by mode: no `dark:bg-slate-900`. Theme tokens already switch between Light and Dark.
- Never build translucency by hand: no `bg-accent-emphasized/50`, no `color-mix(...)` in a component. If you need a translucent color it must exist as a Theme token (`ghost-*`, `stroke-*`, `focus-accent-subtle`, `surface-backdrop`). If none fits, ask for a new token in Figma instead of inventing one.
- If no Theme token fits, **stop and ask**. Do not fall back to Palette or hex.

Palette is documentation only (Storybook, Foundations / Palette). Check before committing: `npm run check:tokens`.

## How a token name is built

```
scope / role / [prominence] / [context] / [state]
```

In CSS the parts are joined with `-`: `--bg-accent-emphasized-hover`. Names come from the **Code syntax** of the Figma variables. Never rename a token in code.

| Part | Values |
| --- | --- |
| **Scope** | `bg` backgrounds of controls and plates · `fg` text and icons · `stroke` boundaries and dividers · `focus` keyboard focus indicator · `surface` window canvas and modal backdrop · `card` card, menu and popover fills · `form` form field fills (input, checkbox, radio) · `ghost` transparent controls |
| **Role** | `neutral` · `accent` · `success` · `warning` · `danger` |
| **Prominence** | `subtle` · `normal` (omitted from the name) · `emphasized` |
| **Context** | `on-emphasized`: the foreground that sits on the same role's emphasized background. Goes after prominence, before state |
| **State** | `default` (omitted) · `hover` · `pressed` · `active` (selected, ghost only) · `disabled` (one universal neutral set) |

One shared prominence scale (`subtle / normal / emphasized`). Only meaningful combinations exist. Do not multiply scope × role × prominence × state yourself.

## What exists where (no Cartesian product)

| Scope | Contract |
| --- | --- |
| `bg` | Subtle, normal and emphasized, each with default / hover / pressed. All five roles. |
| `fg` | Normal and subtle tiers, plus one `on-emphasized` per role. **No hover or pressed foreground.** |
| `stroke` | Three prominence tiers. Emphasized is functional (≥ 3:1), subtle and normal are decorative. **No hover or pressed.** |
| disabled | `bg-disabled`, `fg-disabled`, `stroke-disabled` replace role and prominence together. **No disabled + hover, pressed or focus.** |
| `card` | Neutral only: subtle / normal / emphasized. Emphasized is the top layer (menus, popovers). No interaction states. |
| `form` | Neutral only: default / hover / pressed. |
| `ghost` | hover / pressed / active for every role. **No default**: a ghost control is transparent at rest. |
| `focus`, `surface` | Dedicated: `focus-accent` (+ `focus-accent-subtle` halo), `focus-danger`, `surface`, `surface-backdrop`. No prominence or states. |
| Shadows | Effect styles, not color tokens: `shadow-2xs … shadow-2xl` (`--shadow-*`). |

## Choosing a token: answer four questions in order

1. **What is painted?** background → `bg` · text or icon → `fg` · boundary → `stroke` · keyboard focus → `focus`
2. **What does it mean?** nothing → `neutral` · primary action → `accent` · success → `success` · caution → `warning` · error → `danger`
3. **How prominent?** secondary → `subtle` · ordinary → normal (omit) · primary → `emphasized`
4. **State or context?** hover → `hover` · pressed → `pressed` · selected → `active` · text on an emphasized fill → `on-emphasized`

Examples: secondary caption → `fg-neutral-subtle` · label on a red button → `fg-danger-on-emphasized` · primary button fill → `bg-accent-emphasized` (hover: `bg-accent-emphasized-hover`).

## Repeat and export

Figma needs a leaf name even when a canonical token is also a group. Rule: **repeat only the final leaf, keep the default beside its variants, strip that exact duplicate at export.**

| Figma variable | Exported CSS variable |
| --- | --- |
| `bg/neutral/neutral` | `--bg-neutral` |
| `bg/accent/subtle/subtle` | `--bg-accent-subtle` |
| `bg/accent/emphasized/emphasized` | `--bg-accent-emphasized` |
| `bg/accent/emphasized/hover` | `--bg-accent-emphasized-hover` |
| `fg/accent/accent` | `--fg-accent` |
| `fg/neutral/subtle` | `--fg-neutral-subtle` (no states, no group, no repeat) |

Never write the doubled form (`--bg-neutral-neutral`) in code.

## Theme routing and transparency

- **Palette stores values. Theme selects appearance (Light / Dark). Components read Theme only.**
- Light: `Theme/bg/neutral/neutral → Palette/slate/100`. Dark: `→ Palette/slate/900`.
- Light is `:root`, Dark is `.dark` (add the class to `<html>`). Nothing in a component needs to know the mode.
- **Transparency:** Figma cannot store an alias plus opacity, so translucent colors are Palette variables named `color-alpha/{hue}/{step}-{opacity}` and Theme stores plain aliases to them. Example: `stroke/neutral/subtle → Palette/color-alpha/slate/950-10`.
- In CSS an alpha token is `color-mix(in oklab, var(--color-slate-950) 10%, transparent)`.
- Alpha scale: 05 · 10 · 15 · 20 · 30 · 40 · 50 · 60 · 70 · 80. Only combinations used by Theme exist.
- Palette is hidden from property pickers in Figma. Designers pick Theme tokens only. Developers do the same.

## Contrast contract: WCAG 2.2 AA

Verified in Light **and** Dark against the actual adjacent surface. Translucent tokens are checked **after compositing** over what is behind them.

| Kind | Requirement | Tokens |
| --- | --- | --- |
| Body text | ≥ 4.5:1 | `fg-*`, `*-on-emphasized`, placeholders |
| Large text | ≥ 3:1 (24px and up, or 18.5px and up bold) | display, heading styles |
| Functional boundaries | ≥ 3:1 | `stroke-*-emphasized`, `focus-*` |
| Decorative and disabled | no requirement | `stroke-*` subtle / normal, `*-disabled` |

Rules that follow:
- Put text on a surface it was designed for (`fg-neutral` on `card-neutral` / `surface`, `fg-*-on-emphasized` on `bg-*-emphasized`). Do not pair tokens from different roles for text and background.
- State must never be conveyed by color alone (add an icon, text or shape).
- Every interactive element needs a visible focus indicator using `focus-*` (3:1 against its neighbor).
- Check both modes in Storybook (toolbar Light / Dark) and with the a11y panel before finishing a component.

## Using tokens in code (Tailwind)

Generated mapping (`src/styles/tailwind-theme.css`). `bg-*` tokens drop their prefix, the others keep their scope:

| Token | Class |
| --- | --- |
| `--bg-accent-emphasized` | `bg-accent-emphasized` |
| `--bg-neutral-hover` | `bg-neutral-hover` |
| `--card-neutral` | `bg-card-neutral` |
| `--form-neutral` | `bg-form-neutral` |
| `--ghost-neutral-hover` | `bg-ghost-neutral-hover` |
| `--surface`, `--surface-backdrop` | `bg-surface`, `bg-surface-backdrop` |
| `--fg-neutral-subtle` | `text-fg-neutral-subtle` |
| `--stroke-neutral` | `border-stroke-neutral` (also `divide-`, `outline-`) |
| `--focus-accent` | `ring-focus-accent`, `outline-focus-accent` |

Use a token only in the utility that matches what it paints: `bg-*` classes for background tokens, `text-fg-*` for foreground, `border-stroke-*` for strokes. Do not put an `fg` token in a background or vice versa.

- **Text:** use the text style classes, not loose size/weight utilities. `.display-large`, `.display`, `.heading-large`, `.heading`, `.heading-small`, `.body`, `.body-medium`, `.body-semibold`, `.body-large[-medium|-semibold]`, `.body-small[-medium|-semibold]`, `.body-xsmall[-medium|-semibold]`, `.label-large`, `.label`, `.label-small`, `.link`, `.link-small`, `.caption`, `.caption-small`. Do not write `text-sm font-semibold`.
- **Responsive type:** Desktop values by default, Mobile values below 768px, automatic. Do not add breakpoints for font size.
- **Spacing, radius, size:** Tailwind scale classes (`p-4`, `gap-2`, `rounded-lg`, `max-w-3xl`). No arbitrary values like `p-[13px]`. One step is 4px.
- **Shadows:** `shadow-xs … shadow-2xl`. Not `shadow-[...]`.
- **Font:** Inter (`font-sans`). Weights 400, 500, 600, 700 only.

## Project layout and commands

```
tokens/figma-snapshot.json     snapshot of Figma variables and styles (source for the generator)
scripts/build-tokens.mjs       snapshot -> CSS
scripts/check-tokens.mjs       finds Palette colors and hex in components
src/styles/tokens.css          GENERATED: @theme (Palette, numbers, shadows), :root, .dark, mobile media query, text classes
src/styles/tailwind-theme.css  GENERATED: connects Theme tokens to Tailwind classes
src/foundations/               Storybook "Foundations" pages (colors, palette, typography, spacing, radius, shadows)
```

```bash
npm run storybook      # docs and component playground on :6006
npm run tokens         # rebuild src/styles/*.css from the snapshot
npm run check:tokens   # fail if a component uses Palette or hex
npm run build          # typecheck + production build
```

**Never edit `src/styles/tokens.css` or `tailwind-theme.css` by hand.** Change the variable in Figma, refresh `tokens/figma-snapshot.json`, run `npm run tokens`.

## Adding a component

1. Pick tokens with the four questions above. Keep the state set from the contracts table (for example no hover on foreground).
2. Use only Theme classes and text style classes. No Palette, no hex.
3. Write a story that shows all states, in Light and Dark.
4. Run `npm run check:tokens`, `npm run build`, and look at the a11y panel.

# Talla design system

Design system for **Talla**, a hiring (ATS) web app. React, TypeScript, Vite, Tailwind CSS v4, Storybook.

Source of truth: the Figma file [Talla](https://www.figma.com/design/gaLKdkheoiIoheOPNkCmi6/Talla).

## Quick start

```bash
npm install
npm run storybook     # http://localhost:6006
```

Open **Foundations** in Storybook: Theme colors (Light / Dark switch), Palette, Typography, Spacing, Radius, Shadows.
The toolbar also has a global Light / Dark switch for every story.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run storybook` | Docs and component playground |
| `npm run build-storybook` | Static Storybook in `storybook-static/` |
| `npm run tokens` | Rebuilds `src/styles/tokens.css` from `tokens/figma-snapshot.json` |
| `npm run check:tokens` | Fails if components use Palette colors or hex |
| `npm run build` | Typecheck and production build |
| `npm run lint` | oxlint |

## Tokens

Variable names come strictly from the **Code syntax** of the Figma variables.

| Figma | CSS |
| --- | --- |
| Palette, Number value | `@theme` in `src/styles/tokens.css` |
| Theme / Light | `:root` |
| Theme / Dark | `.dark` (add the class to `<html>`) |
| Typography / Desktop | `:root` |
| Typography / Mobile | `@media (max-width: 767px)` |
| Text styles | classes: `.heading-large`, `.body-small`, … |
| Effect styles `Shadow/…` | `--shadow-…` |

Theme tokens are wired into Tailwind, so classes like `bg-accent-emphasized` and `text-fg-neutral-subtle` work and follow the mode automatically.

`tokens.css` is generated: do not edit it by hand. To update, change the variables in Figma, refresh `tokens/figma-snapshot.json`, run `npm run tokens`.

## Rules

Read [CLAUDE.md](CLAUDE.md). The main one: **components use Theme tokens only**. No Palette colors, no hex.

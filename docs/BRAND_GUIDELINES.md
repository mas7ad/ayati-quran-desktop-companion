# Ayati - Quran Desktop Companion — Brand guidelines

## Colors

| Name | Hex |
|------|-----|
| Emerald | `#67E0A3` |
| Aquamarine | `#7CF0BD` |
| Celadon | `#AFF9C9` |

## Fonts

**Latin**

- Display: Sora, Outfit, or Fraunces
- UI: Inter or Source Sans 3
- Monospace: JetBrains Mono or IBM Plex Mono

**Arabic**

- Verses: Amiri Quran or Scheherazade New
- UI: Noto Naskh Arabic or Lateef

## Assistant Menu Aesthetic

The assistant settings panel follows a **minimalist, content-forward** design — every element is stripped back to only what's functionally necessary.

### Layout

- **Flat, containerless** — no card borders, background fills, or inset shadows grouping items. Each settings section is separated by a single subtle `border-neutral-900` bottom divider.
- **Collapsible accordions** — each section title acts as a disclosure toggle with a rotating chevron icon. Sections default closed to reduce cognitive load.
- **Tight spacing** — `space-y-3` between items inside sections, `px-5 py-4` outer padding.

### Form elements

- **Inputs** — no border box. A thin `border-b border-neutral-800` line is the only delimiter, matching the To Do tab's text input style. Transparent background.
- **Selects** — same bottom-border-only treatment as inputs. Dropdown menus use `bg-[#0f0f0f]` with `border-neutral-800`.
- **Switches** — the only interactive element with a filled track. Off state `bg-neutral-700`, on state `bg-[#67E0A3]`. No extra border.

### Typography & color

- **Section headers** — uppercase, `text-neutral-500`, `tracking-widest`, `text-xs`. Pure labels, no visual weight.
- **Item titles** — plain `text-sm` inheriting `text-foreground`. No `font-medium` or color emphasis.
- **Descriptions** — `text-[11px] text-neutral-600`, tight `mt-px` gap from the title.
- **Form labels** — `text-[11px] text-neutral-600` above the input, minimal hierarchy.
- **Secondary actions** (Sign Out, Dev actions) — simple text buttons with `text-neutral-500 hover:text-neutral-300`.
- **Primary action** (Sign In) — `text-[#67E0A3]` text link.
- **Destructive action** (Quit) — `text-neutral-600 hover:text-red-400` text link, no button container.

### Principles

1. **No redundant containers** — if a border or background doesn't communicate meaning, remove it.
2. **Flat hierarchy** — avoid layered nesting. A single bottom border is enough to separate.
3. **Low contrast hierarchy** — titles, labels, and descriptions differ by role, not by color prominence.
4. **The switch is the accent** — `#67E0A3` is reserved for the active state of toggles and the primary call-to-action text.

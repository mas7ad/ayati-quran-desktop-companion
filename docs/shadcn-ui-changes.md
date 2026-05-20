# Per-Tab Opportunities


## 2. Prayers Tab

| Current | shadcn Component | Benefit |
| --- | --- | --- |
| Country/City/Calculation method `<select>`s | Select | Consistent styling, search/filter, better UX |
| Enable Prayer checkbox | Checkbox or Switch | Polished animation |
| Number inputs (lead minutes) | Input | Validated, consistent |
| Save/Section buttons | Button | Variants (primary, secondary, ghost) |
| Prayer time rows | Card | Hover states, consistent borders |
| Next Prayer display | Card | Clean container |

## 3. To Do Tab

| Current | shadcn Component | Benefit |
| --- | --- | --- |
| Add Task button | Button | Consistent with rest of app |
| Dropdown form (title, notes, priority, dates) | Collapsible or Dropdown Menu | Built-in animation, outside-click |
| Native inputs/textareas | Input, Textarea | Consistent focus rings |
| Todo item containers | Card | Hover, selection state |
| Delete button | Button (destructive variant) | Red state, confirmation |
| Checkboxes | Checkbox | Animated, accessible |

## 4. Focus Tab

| Current | shadcn Component | Benefit |
| --- | --- | --- |
| Timer card | Card | Consistent |
| Task selector `<select>` | Select | Better UX |
| Minutes number inputs | Input | Consistent |
| Start/Pause/Resume/Cancel buttons | Button (variants) | Colors for actions |

## 5. Reflections Tab

| Current | shadcn Component | Benefit |
| --- | --- | --- |
| Search input | Input (with search type) | Consistent |
| Filter `<select>`s (3×) | Select | Better filter UX |
| Empty state | Can stay as-is or Card | — |
| Reflection article containers | Card | Hover states |
| Note textarea | Textarea | Consistent |
| Show Tafsir/Play/Delete buttons | Button (ghost/destructive) | Semantic variants |

## 6. Settings Tab (biggest win!)

| Current | shadcn Component | Benefit |
| --- | --- | --- |
| Toggle switches (7×) | Switch | Biggest visual upgrade: animated, accessible, no hidden checkbox hack |
| Collapsible SettingsSection | Collapsible or Accordion | Same behavior, with built-in animation |
| Selects (font, translation, tafsir, reciter, country, city, method) | Select | Unified look |
| Number inputs | Input | Consistent |
| Sign In / Sign Out buttons | Button | Primary/secondary variants |
| Quit button | Button (destructive) | Red, consistent |
| Dev section buttons | Button (ghost) | Consistent |

## 7. Shared Components

| Component | Current | shadcn Replacement | Benefit |
| --- | --- | --- | --- |
| SettingsSection | Hand-rolled collapsible with max-h animation | Collapsible | Cleaner animation, accessible |
| KeychainConsentModal | Fixed div with manual backdrop | Dialog | Focus trap, ESC key, aria-modal, portal |
| GatewaySetupModal | Fixed div with manual backdrop | Dialog | Same as above |
| GatewayConnectionBanner | Hand-rolled with inline SVGs | Alert (with variant) | Warning/success variants |
| AiProviderSettingsFields | Custom selects, inputs, labels | Select, Input, Label | Consistency |
| MarkdownMessage | Custom styling | Stays — too specialized for shadcn | — |

---

## Quick Summary — Biggest ROI

1. **Switch** — Replaces all 7–8 toggle checkboxes (Settings tab + Prayers). Biggest visual polish win.
2. **Dialog** — Replaces KeychainConsentModal and GatewaySetupModal. Gets focus trapping, ESC to close, backdrop for free.
3. **Select** — ~20+ native selects become styled consistently with proper disabled states and positioning.
4. **Button** — One `<Button>` component replaces 3+ manual variants across 30+ buttons.
5. **Tabs** — The 5 manual tab buttons become an accessible, keyboard-navigable tab bar.
6. **Collapsible** — Replaces SettingsSection's hand-rolled max-h accordion.
7. **Card** — Wraps ~20+ `border border-white/10 rounded-md` divs into a consistent `<Card>` component.
8. **Input / Textarea** — Standardizes the repeated `SETTINGS_NUMBER_INPUT_CLASS` pattern.
9. **Checkbox** — Polishes the 5 native checkboxes.

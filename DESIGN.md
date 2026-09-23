# FixFlow interface direction

The interface should feel like a calm facilities operations desk: practical, dense enough for real queue work, and clear at a glance. It is not a marketing dashboard. Screens should help each role make the next workflow decision without losing issue context.

## Visual language

- Use Aptos or Segoe UI Variable with compact labels, strong sentence-case headings, and restrained letter spacing.
- The page canvas is cool gray (`#f4f6f8`), working surfaces are white, and the navigation rail is navy (`#101928`).
- Blue is the primary action and focus color. Orange marks attention, teal marks active work, green marks completion, and violet marks assignment. Always pair color with text.
- Borders provide most separation. Shadows stay soft and secondary; controls use modest 5–8px corner radii rather than floating pill-shaped cards.
- No raster imagery is part of the current interface. If imagery is added later, record its source and license here.

## Admin workspace

The admin screen follows one operational sequence:

1. Scan the workload strip for pressure.
2. Narrow the issue queue with filters.
3. Select one issue without leaving the queue.
4. Review its location, category, reporter, and current owner.
5. Set priority inline or assign a technician from the persistent detail panel.

On wide screens the detail panel stays beside the queue. Below 1220px it moves below the table, and below 700px each table row becomes a labeled card. At 360px the controls use a single column and remain touch friendly. The workload strip may scroll horizontally so its compact comparison remains intact.

## Reusable patterns

- Eyebrows are small blue uppercase labels that establish location, not decoration.
- Status pills always include the written status.
- Priority controls keep the semantic tone visible while remaining native selects.
- Loading uses row-shaped skeletons. Empty and failed states explain what happened and provide one recovery action.
- The development preview must remain visibly labeled and must never be enabled in production.

## Accessibility and content

Keyboard focus uses a visible blue outline. Every select has a programmatic label, table actions include the issue title, errors use `role="alert"`, and loading regions expose busy state. Copy is short, direct, and operational: describe the action and its result without invented performance claims.

Direction seed: `f12064a6` (maintenance control-room surface). Reviewed at desktop and 390px mobile width on 2026-09-22.

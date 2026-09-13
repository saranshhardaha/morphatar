# Changelog

Both packages are versioned and released together.

Because avatars are regenerated from a seed rather than stored, **any change to
rendered output changes every existing avatar**. Those are marked below, and the
golden fixture in `packages/core/test/fixtures` exists to make them impossible to
ship by accident.

## 0.2.0 — unreleased

Metadata only. Rendered output is byte-identical to 0.1.1.

### Changed

- `homepage` now points at the playground rather than a branch path that no
  longer resolves
- Widened `keywords` on both packages
- `@morphatar/react` declares `engines.node >= 18`, matching core

## 0.1.1 — 2026-09-12

Eye motion replaces whole-shape motion. **Changes rendered output** for any
avatar using `animation`.

### Added

- `animation="blink"` — the eyes squash to a line and reopen on a ~4.4s cycle
- `animation="dart"` — the eyes shift left, then right, then settle

Both move the eyes only, so they apply to the `organic` variant alone;
`geometric` and `pixel` have no eyes and emit no keyframes at all. Motion pivots
on the eyes' own box via `transform-box: fill-box`, and respects
`prefers-reduced-motion`.

### Removed

- `animation="pulse"`, `"morph"`, `"spin"` — whole-shape motion smears at avatar
  sizes, which is what the eye animations replace

Pin `0.1.0` if you depend on the removed values.

### Notes

- A still avatar's markup is unchanged: the eyes only get their own group when
  something animates them
- Core is 6.02 KB gzipped, still zero runtime dependencies

## 0.1.0 — 2026-09-12

First release.

- `morphatar()` returns a standalone `<svg>` string; `morphatarDataUri()` and
  `morphatarPalette()` alongside it
- Three variants: `organic` (a single closed-spline blob with eyes), `geometric`
  (Bauhaus grid), `pixel` (mirrored identicon)
- Deterministic by construction: FNV-1a into splitmix32 into sfc32, with no
  `Math.random()`, `Date` or ambient state
- Generated palettes clear WCAG AA 4.5:1 against the contrast anchor
- `@morphatar/react` wraps the core and memoises on the options

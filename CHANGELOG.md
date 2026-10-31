# 0.6.1

- Darken all four rings when the configured smart plug reports off, preserving the saved color.
- Restore the selected lighting when power returns; keep deliberate Lights off dark.
- Do not infer power-off from cloud connectivity or unknown/unavailable plug states.

# 0.6.0

- Add a translated visual editor with eight ring-color presets, native color picker, HEX entry, Default and Lights off.
- Save the shared ring color per card; underline the active tab independently of color.
- Keep LCD appearance, backend data and device commands unchanged.

# Changelog

## 0.5.0

- HACS plugin manifest and single-file distribution with eight bundled languages.
- Custom JSON overrides remain supported outside the HACS-managed directory.
- Deterministic dependency-free build, offline bundle tests and HACS validation workflow.
- Document migration from the manual resource without duplicate card registration.

## 0.4.2

Initial standalone source distribution of the tested dashboard card.

- Eight extensible language catalogs with US English fallback.
- Recipe editing state 6010 title and explanatory text.
- Existing telemetry display and smart-plug controls preserved.

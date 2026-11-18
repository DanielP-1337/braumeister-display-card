# Display Card 0.7.0-beta.27

- Replace the obsolete Recipe footnote and legacy time row with verified target/elapsed rest times and device start-delay countdown. Boil heat-up (3010) also shows live target/elapsed values with Integration 3.2.1-beta.11.
- Show the configured `entities.recipes` device-recipe sensor: mash-in temperature, programmed rests, boil target/duration, and hop additions in minutes before the end of boiling. Wide cards show live values and the stored plan side by side; narrow cards stack them.
- Match the current recipe only by a unique exact name. If account/device names differ, select a stored recipe for viewing. This is read-only and does not select a recipe on the device. Live recipe edits may differ from the stored plan. No estimated whole-brew remaining time or invented completion checkmarks.
- Add the observed rest-end, malt-pipe-removal, and boil-start confirmations. Requires Companion 0.1.0-beta.17 and Bridge 0.5.1-beta.9. Boil start retains the remote-heating guard and confirmation dialog. Cancel requests a pause; a second Cancel aborts. The new stop contexts need hardware validation. Resume in these later paused states remains unverified.
- Show the middle Up/Down buttons only in the observed boil temperature/time editor (`ADUS`, `00T`/`00Z`). Editor commands remain a documented TODO, including cancel/revert behavior and boundaries.
- All new text is bundled in eight languages. No proprietary audio added.

In the card YAML, map `entities.recipes` to the **Device recipes** sensor belonging to the same Braumeister. This is a list entity, separate from `entities.recipe` (the current recipe name).

Update only when the brew has finished: install the Bridge through the existing HA App Store beta channel, then Companion and Integration through HACS, restart HA as requested, update the card and reload the browser. No running device is restarted by publishing these releases.

The observed lid-removal acknowledgment (`3010/qH/0DT` → `3010/qH/00T`) is now a separate guarded confirmation, not generic Resume. Cancel and Up/Down at that warning remain unverified and unavailable.

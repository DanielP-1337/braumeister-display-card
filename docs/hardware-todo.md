# Hardware mapping and validation TODO

Updated November 18, 2026 after the user-operated Braumeister 20 L Plus tests
(firmware 1.1.27). This list supersedes older pending-test statements in the
chronological observation documents. Cloud observations, implementation, automated
coverage, and successful HA hardware tests are separate evidence levels.

## Open

- [ ] Re-test rejected hop acknowledgment and brewing-complete Select with Card
  0.7.0-beta.35, Companion 0.1.0-beta.22, Integration 3.2.1-beta.15 and Bridge
  0.5.1-beta.13. Record the exact action/screen/actuator/indicator diagnostic if
  rejected. Existing captures match supported transitions; the earlier refusal
  remains unexplained. Do not expand permissions from an old screenshot alone.
- [ ] Verify obsolete action messages clear on device screen, pause, and editor
  context changes. Late responses must not restore old messages (automated tests
  pass; live validation pending).
- [x] Current-run HA confirmation: rest end, malt-pipe removal, boil start, and
  Heating to boil pause/resume succeeded (user report and recorder follow-up).
- [ ] Re-test both lid-warning variants through HA.
- [ ] Implement and validate the state-3010 boil editor: Select opens temperature,
  Select advances to time, Select closes; keys 2/3 change temperature by 1 °C or
  duration by 60 seconds. Determine limits and Cancel behavior before enabling
  unverified operations. Test state 3070 separately; do not infer identical behavior.
- [ ] Capture final Cancel from hop/completion pauses (3080/3450, indicator 120),
  including the actual target screen. These final-abort paths remain unverified.
- [ ] Capture final Cancel from the Heating to boil pause (3010/120); HA Cancel
  is still unavailable there. Successful pause/resume does not validate final abort.
- [ ] Resolve the portal/editor discrepancy: the user perceived direct-to-time
  entry, but two recorded cycles include `00T` for 6–10 seconds before a second
  Select enters `00Z`. See [timestamped evidence](boil-editor-followup-2026-11-18.md).
- [ ] Test Cancel/Up/Down at the lid warning; do not infer editor-cancellation behavior.
- [ ] Test physical Up/Down at 2705 (Malt added?). No recognizable effect was
  observed through MySpeidel; do not assign an invented function.
- [ ] Verify automatic delayed-start countdown expiry and timed-rest editor behavior.
- [ ] Finish HA regression checks for direct start and mash/purge prompts, and
  repeat new-alarm navigation from Recipe/Power/Status with sound muted/unmuted.
- [ ] Verify Hue notification colors and restoration on actual lights.
- [ ] Compare the fork with upstream Integration 3.3.0 / Bridge 0.6.0 before any
  migration. Closing upstream issues #18/#28 is not evidence that every fork fix
  or action was merged. The version set above is our tested beta baseline.

## Confirmed by the user through HA

- Whirlpool and Cheers Select work (including the latest follow-up).
- Resume from a tested mash-rest pause works with the confirmation dialog.
- Sound works on notebook, phone, and tablet; repeat playback and local mute work.
  Muting does not clear the device alarm or resume the process.
- Recipe matching and current-stage highlighting work after matching by device slot.

## Related observations

- MySpeidel's per-step info buttons show explanatory text and animations/videos.
  This is a possible future UI enhancement, not implemented or promised here.
  Original MySpeidel sound/media files are not included in the repository.
- Hot start: already-satisfied heating is skipped while the timed rest runs
  normally. Preserve device behavior rather than introducing a new brewing policy.

No raw diagnostics, device identifiers, credentials, or account data are published.

# Hardware mapping and validation TODO

Updated November 18, 2026 after the user-operated Braumeister 20 L Plus tests
(firmware 1.1.27). This list supersedes older pending-test statements in the
chronological observation documents. Cloud observations, implementation, automated
coverage, and successful HA hardware tests are separate evidence levels.

## Open

- [x] Add normal heating-to-boil pause with `3010/qH/000` to Bridge/Companion
  source mapping. Cloud key 1 at 19:03:00 (1941) reaches `3010/ph/120` (1943);
  another key 1 at 19:03:09 (1961) reaches `101/ph/000` (1963).
  This is distinct from the active lid-warning indicator `0D0`.
- [x] Package qH/000 pause and the pH rest-end target fix together in Bridge
  beta.15 / Integration beta.17, Companion beta.24 and Card beta.37.
- [x] Hardware-test qH/000 pause after installing that coordinated beta set.
  HA key 1 at 20:36:36.449 (3795) in `3010/qH/000` reaches
  `3010/ph/120` at 20:36:38.412 (3797). The pH rest-end target remains pending.

- [x] Add the observed rest-end target variant `2910/Pi/010` -> `2930/pH/000`
  to Bridge source mapping (MySpeidel key 4, 18:50:44–48, sequences 1188–1190).
  Existing `2930/pH/000` malt-pipe confirmation is already supported.
- [ ] Hardware-validate this target-confirmation adjustment in Bridge beta.15.
  It does not enable source `2910/qi/010`; that remains open.

- [ ] Non-blocking follow-up: verify rest-end acknowledgment directly while
  actuator flags are `qi`. Per the user's scope decision, this hot-start edge
  case does not block the upstream protocol-documentation PR; no further
  artificial hot-start run is required for that PR. Keep the unverified action
  unsupported and the flag interpretation explicitly hypothetical.
  At 18:27:03 (sequence 3695), state `2910/qi/010` was reported and HA rejected
  Select. The same prompt changed to `2910/Pi/010` at 18:27:49 (3729), before
  MySpeidel key 4 at 18:28:19 (3754) reached `2930/pi/000` (3756).
  This proves the qi variation exists, but not a key-4 transition under qi.
  Do not describe that cloud acknowledgment as a directly observed qi command.
  The new qi permission in Companion beta.23 / Bridge beta.14 applies to state
  2510 only; it does not resolve this distinct state-2910 finding.
  See the [hot-start/pump-protection hypothesis and focused test checklist](rest-end-qi-hot-start-2026-11-18.md).
  The UI reports pump shutdown at 88 °C and release at 84 °C; a causal link to qi
  is plausible but unconfirmed. At 21:00, HA key 4 used PH/010 and reached
  `2930/pH/000`, then `2930/pi/000`; this was not a qi test or a Pi-source test.
  Working flag interpretation: q = pump inhibited by temperature protection;
  i = heater inactive at/above target (possibly a broader heating pause).
  The recorded PH -> qH change at 21:09:59 coincides with the user's reported
  pump-protection stop at 88 °C. These meanings remain hypotheses, not new guards.
  At 21:25:26 (6843), rest end again reported qi/010 and HA rejected Select.
  At 21:27:21 (6939), flags changed to Pi; HA key 4 at 21:27:32 (6946)
  then reached `2930/pi/000` (6948). The user observed pump release below 84 °C;
  the result screenshot shows 83.5 °C. The later report was clarified to refer
  to this same HA test, not a new MySpeidel run. If revisited, capture MySpeidel
  acknowledgment while qi persists and verify the actual command-source tuple.

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
- [ ] Finish HA validation of the editor-associated lid-warning variant `0DT`;
  normal `0D0` Cancel is now verified (see below).
- [ ] Implement and validate the state-3010 boil editor: Select opens temperature,
  Select advances to time, Select closes; keys 2/3 change temperature by 1 °C or
  duration by 60 seconds. Determine limits and Cancel behavior before enabling
  unverified operations. Test state 3070 separately; do not infer identical behavior.
- [ ] Capture final Cancel from hop/completion pauses (3080/3450, indicator 120),
  including the actual target screen. These final-abort paths remain unverified.
- [x] Capture Cancel at the normal lid warning and final Cancel from the resulting
  Heating to boil pause: `3010/qH/0D0` → `3010/ph/120` → `101/ph/000`, two
  separate cloud key-1 commands. See [recorded evidence](lid-cancel-2026-11-18.md).
- [x] Implement those exact lid-pause and final-abort actions in Card beta.36,
  Companion beta.23 and Bridge beta.14 (Integration beta.16 package).
- [x] HA final abort from `3010/ph/120` reached `101/ph/000` at 20:03:41,
  after the user confirmed the permanent-abort dialog. HA pause immediately
  before this used `3010/PH/000`. See [validated run](ha-heating-abort-2026-11-18.md).
- [x] Hardware-test Cancel at the active normal lid warning `3010/qH/0D0`
  through HA without first pressing Select: key 1 at 20:31:50.808 (3510)
  reaches `3010/ph/120` at 20:31:52.091 (3512).
  See [HA evidence](lid-cancel-2026-11-18.md#ha-hardware-validation-at-20312036).
- [ ] Hardware-test hot-start mash acknowledgment with `2510/qi/010` in the same
  beta set. Cloud key 4 at 18:20:26.582 (3212) reached `2610/ph/000` at
  18:20:27.254 (3214). The old Pi-only guard caused the reported rejection;
  qi is now explicitly supported for this prompt.
- [ ] Resolve the portal/editor discrepancy: the user perceived direct-to-time
  entry, but two recorded cycles include `00T` for 6–10 seconds before a second
  Select enters `00Z`. See [timestamped evidence](boil-editor-followup-2026-11-18.md).
- [ ] Test Cancel at the editor-associated lid warning (`0DT`) and any displayed
  Up/Down buttons; do not infer editor-cancellation behavior from normal `0D0`.
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

- Active normal lid-warning Cancel (`qH/0D0`) -> pause at 20:31, followed by
  resume to `qH/000` at 20:35 and normal heating-to-boil Cancel -> pause at
  20:36. All three commands are recorded as `local_control`.
- Normal heating-to-boil Cancel with PH/000 -> pause, followed by final Cancel
  with confirmation dialog -> main menu (20:02–20:03, local-control log verified).
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

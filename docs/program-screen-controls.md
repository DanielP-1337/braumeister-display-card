# Program-screen controls — 0.7.0-beta.8

This branch adds the missing visual keys while preserving the four lower tabs
and the existing menu/actuator controls. It is not yet a published end-to-end brew
control release: matching betas Bridge 0.3.2-control.4-beta.1 and Companion 0.1.0-beta.6 add recipe confirmation,
pause/final abort at 2300/2410, and resume at 2300 only. Unsupported actions are visible but disabled, with an explicit
explanation, rather than being silently sent to a legacy backend.

## Screens and evidence

| Screen | Device state | Display keys |
| --- | --- | --- |
| Recipe selection | 2015 | Cancel, Down, Up, Select |
| Water added? | 2030 | Cancel, Down, Up, Select |
| Purging pump | 2300 / 2310 | Cancel (request pause, not final abort) |
| Heating to mash-in | 2410 | Cancel (request pause, not final abort) |
| Automatic program paused | program state + interrupt 1 | Cancel (final abort), Resume |

The tester supplied these passive Bridge snapshots after clicking Cancel in
MySpeidel, on 2026-11-06:

```json
{"state":"2300","flags":"ph","indicator":"120"}
{"state":"2410","flags":"ph","indicator":"120"}
```

Further user-reported outcomes:

```json
{"action":"final abort","state":"101","flags":"ph","indicator":"000"}
{"action":"resume purge","state":"2300","flags":"Ph","indicator":"000"}
```

The screen code stays unchanged; field 15's interrupt digit distinguishes the
paused dialog. Both actuators are reported off. The supplied portal screenshot
shows **Automatik angehalten**, Cancel/Select, a pulsing red screen border and
the tester reports sound at the appliance and in the browser. This is evidence
of a pause dialog, not evidence that the first Cancel returned to the main menu.
The existing decoder maps interrupt 1 to this dialog and interrupt >1 to an
error, which must not be treated as a resumable pause.

The Card adds a red pulsing screen outline for the live pause, supports
`program_alarm_animation: false`, and respects reduced-motion preferences. It
does not introduce browser audio playback or manipulate the device's alarm.
An unavailable/offline/stale device does not show a live pause animation.

## Capability and dispatch boundary

Matching beta adapter contract:

- Recipe Select uses `braumeister_menu.navigate`, **only** when its HA action
  selector explicitly advertises `select_recipe`.
- The other new buttons require a separate `braumeister_menu.program_control`
  service whose action selector explicitly advertises the requested action.
  Earlier Companion versions have no such service; Companion 0.1.0-beta.6 advertises
  only request pause, final abort and resume. The Card never falls back to
  raw key presses or the old navigation service for program actions.
- Prepared actions: `select_recipe` through navigation; `request_program_pause`,
  `abort_program`, `resume_program` through program control. The Card restricts
  resume to 2300 and pause/final abort to 2300/2410. State 2310 is displayed but
  its program action is not yet enabled. Water actions `cancel_water_prompt`,
  `start_delay_down`, `start_delay_up`, `confirm_water_filled` remain unimplemented
  in the backend and disabled in the Card.
- Starting/resuming or changing the delayed start additionally requires Card
  `program_control: true`. The existing admin, online, heartbeat and pending-action
  gates remain in force. Water confirmation/resume require an additional browser
  confirmation; final abort has its own distinct confirmation.
- Cancellation actions do not depend on opting into starting/resuming. The
  backend must independently validate source state, interrupt, permissions,
  freshness, collision avoidance and subsequent device evidence. Frontend gates
  are not a substitute for that validation.

The matching beta Bridge/Companion service has not been hardware tested. The local Node tests use synthetic service metadata to verify
routing and refusal behavior, not a real HA service or device.

## Remaining work before an operational release

1. Validate the prepared Bridge and Companion on hardware with individual actions.
   The earlier local safety prototype already documents recipe selection
   `2015 -> 2030` using `$k=4`; earlier versions excluded it. Pausing needs indicator-aware confirmation, not a screen
   code match alone.
2. The final-abort and purge-resume outcomes above were reported through the
   cloud path. Do not label the first pause request as a completed abort. Confirm command delivery and telemetry
   through the local API before calling it hardware-validated.
3. Verify the water prompt's 30-minute delayed-start behavior and fields before
   implementing its Up/Down or confirmation actions. Do not assume that selecting
   a recipe is equivalent to confirming water or immediately starting a program.
4. Keep water/heating permission checks on the server and preserve the separate
   permission for heating. Starting, resuming and cancelling must remain distinct.

All new text is present in eight catalogs. Seven local test scripts cover
screen-key rendering, `120` interrupt handling, disabled legacy-backend behavior,
capability metadata, opt-ins/confirmations, stale telemetry, errors, translations,
pending locking and the existing controls. No device command, HA restart or
installation was performed for this preparation.

## User-reported hardware validation — 2026-11-06

The user confirmed Supervisor Bridge 0.3.2-control.4-beta.1 is started,
update_available is false and /api/health returns ok=true with one device.
Through the HA Display Card, Cancel while heating opened the automatic-program
pause dialog. A second Cancel displayed the final-abort confirmation. After
confirmation, HA, the physical appliance and MySpeidel all returned to the main
menu. This validates the reported heating pause/final-abort path; it does not
validate every program state or resume.

During pump purging, Cancel was still disabled. The user subsequently confirmed
the exact device status: state `2300`, flags `Ph`, indicator `000`. This tuple is
already permitted by both Companion `PROGRAM_RULES` and Bridge
`program_transition`; extending either allowlist is not justified by this report.
HA's display decoder converts the state to integer `2300` and the interrupt to
integer `0`. Card source and distribution both allow `request_program_pause`
at integer `2300`, independently of the start/resume opt-in.

The added local Card regression uses that decoded purge status and verifies an
enabled Cancel button plus dispatch to `program_control/request_program_pause`.
It passes against the distribution bundle. This establishes local behavior,
not the identity or runtime state of the installed Card. Existing Companion and
Bridge tests already cover `2300 / Ph / 000`; rerunning those Python tests in
this session was blocked by missing `pytest` in the available Python 3.11.

The installed UI cause remains unresolved. The next passive investigation should
inspect the loaded Card asset/version, the step entity's actual decoded attribute
types, advertised HA `program_control` action metadata, and Card gates (admin,
online, heartbeat, pending action). No additional appliance-status sample is
needed. State `2310` is not an explanation for the supplied `2300` report.
No device commands, installation, release, or runtime permission changes were
performed in this investigation.

All four water-question keys remain deliberately disabled, including water
confirmation and delayed-start adjustment. The user confirmed this expected UI.

## User-reported hardware test — 2026-11-06

The user reports a successful test on the real Braumeister after the HACS test releases Display Card 0.7.0-beta.9 and Companion 0.1.0-beta.7 were provided. The reported problem was the disabled Cancel button during pump purging; the confirmed input status was state 2300, flags Ph, indicator 000. Installed baseline: Bridge 0.3.2-control.4-beta.1 and HA integration 3.1.1-beta.2.

This validates the reported pump-purge Cancel use case. The user had previously confirmed heating Cancel, the final-abort confirmation dialog and return to the main menu. This report does not establish validation of resume, water confirmation, delayed start, or every program stage. It also does not prove that the original installed UI failure was caused by a string-valued screen code.

Card beta.9 accepts numeric and numeric-string screen codes at the menu lookup/dispatch boundary; all seven local Node test scripts passed. Companion beta.7 retains beta.6 control rules. Python tests were not rerun in this follow-up because the available interpreter lacks pytest; earlier suite results remain historical. The assistant issued no appliance commands.
### Open investigation — Select during a timed rest (2026-11-13)

On the second rest of a 20 L Plus brew (72 °C, five minutes), MySpeidel showed only Cancel while heating. Once the rest timer advanced, MySpeidel and HA showed Cancel and Select. The tester reports that pressing Select in MySpeidel then revealed Down and Up between the two existing keys. No visible effect of the arrow keys was reported. The screenshot at 2:49 still shows a 72 °C target and a five-minute duration.

- [ ] Compare the device display and status frames immediately before and after Select to identify how to recognize the four-key screen.
- [ ] Determine whether Down/Up change a pending value, when a change becomes visible, and how the screen exits. The function of the arrows is unverified.

Follow-up from Chrome DevTools during the timed rest: pressing Up produced a MySpeidel GET request whose path ended in `/k/3`. The server returned HTTP 200 (response header dated 22:31:01 UTC, 2026-11-13). The tester observed both arrow keys disappear immediately after the press. This identifies the key in the cloud UI and the visible exit after Up. Device receipt, any change of target or duration, and the behavior after Down remain unverified.

Down follow-up: Chrome DevTools showed a GET ending in `/k/2` and HTTP 200 from MySpeidel. The response Date was 2026-11-13 22:33:32 UTC (23:33:32 CET). The screenshot records the cloud response only. Whether the arrows disappeared after Down and whether a device value changed are still open.

### Boil target editing — live observation, 2026-11-13

The tester confirmed that Up and Down in MySpeidel adjust the boil target during the running program when the target temperature is framed. The 23:49 screenshot shows a framed 98 °C target. At 23:50 the framed target reads 95 °C, the measured temperature is 96.5 °C, and the boil timer shows 0:07 of 10 minutes. The four keys are Cancel, Down, Up and Select. The per-press increment, commit behavior and device status marker for this edit screen remain to be verified. The effect of the arrows during a mash rest is still open.

At 00:00 on 2026-11-14 the portal showed the running boil at 9:50 of 10 minutes, target 95 °C unframed, actual 94.5 °C, with Cancel and Select only. At 5:49 the same target and actual had appeared with a framed target and all four keys. The mechanism that closed the edit view is unknown. Beta.19 always previews four keys during the timed boil. Compare field 13 (key labels) and field 15 across both live snapshots before mapping the layout; elapsed time alone does not identify it.
[Full live brew report and remaining questions](live-brew-2026-11-13.md).

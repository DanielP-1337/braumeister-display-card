# Program-screen controls — local, unreleased preparation

This branch adds the missing visual keys while preserving the four lower tabs
and the existing menu/actuator controls. It is not yet a working end-to-end brew
control release: the published Companion and Bridge do not implement these new
program actions. Unsupported actions are visible but disabled, with an explicit
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

This is a proposed adapter contract for the subsequent Bridge/Companion work:

- Recipe Select uses `braumeister_menu.navigate`, **only** when its HA action
  selector explicitly advertises `select_recipe`.
- The other new buttons require a separate `braumeister_menu.program_control`
  service whose action selector explicitly advertises the requested action.
  The published Companion has no such service. The Card never falls back to
  raw key presses or the old navigation service for program actions.
- Proposed actions: `cancel_water_prompt`, `start_delay_down`, `start_delay_up`,
  `confirm_water_filled`, `request_program_pause`, `abort_program`, `resume_program`.
- Starting/resuming or changing the delayed start additionally requires Card
  `program_control: true`. The existing admin, online, heartbeat and pending-action
  gates remain in force. Water confirmation/resume require an additional browser
  confirmation; final abort has its own distinct confirmation.
- Cancellation actions do not depend on opting into starting/resuming. The
  backend must independently validate source state, interrupt, permissions,
  freshness, collision avoidance and subsequent device evidence. Frontend gates
  are not a substitute for that validation.

No new Bridge/Companion service is claimed to exist or be hardware-tested by
this UI branch. The local Node tests use synthetic service metadata to verify
routing and refusal behavior, not a real HA service or device.

## Remaining work before an operational release

1. Extend Bridge and Companion on explicit, verified transition definitions.
   The earlier local safety prototype already documents recipe selection
   `2015 -> 2030` using `$k=4`; the currently installed/published control path
   still excludes it. Pausing needs indicator-aware confirmation, not a screen
   code match alone.
2. Capture final abort and resume outcomes separately; do not label the first
   pause request as a completed abort. Confirm command delivery and telemetry
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

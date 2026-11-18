# Remove-lid Cancel and final abort

User-operated Braumeister 20 L Plus, firmware 1.1.27, November 18, 2026.
The user reported Cancel in MySpeidel followed by the main menu. The Bridge
recording establishes two separate cloud key commands with a paused state in
between; it does not establish a direct one-command transition to the main menu.

Times below use Europe/Berlin (UTC+01:00). Tuples are state / button labels /
actuator flags / field 15. No raw captures or identifying data are published.

| Time | Sequence | Event |
| --- | --- | --- |
| 18:12:53.280 | 2722 | Lid warning: `3010/A00S/qH/0D0` |
| 18:15:22.025 | 2843 | Cloud key 1 in `3010/A00S/qH/0D0` |
| 18:15:24.027 | 2845 | Paused: `3010/A00F/ph/120` |
| 18:15:27.396 | 2856 | Cloud key 1 in `3010/A00F/ph/120` |
| 18:15:29.393 | 2858 | Main menu: `101/EMSR/ph/000` |

Thus Cancel at the normal lid warning pauses the program. A subsequent Cancel
from this heating-stage pause ends it. The recording contains two commands;
browser click count and rendering between them are not captured. Actual
temperature was 95.5 °C. Target field 4 remained 960 even in the main menu, so
that residual target alone is not evidence of continued heating.

These exact cloud transitions are implemented in Card beta.36, Companion beta.23,
and Bridge beta.14. HA hardware validation is recorded below. Do not generalize to the
editor-associated `0DT` lid warning or paused hop/completion states.

## HA hardware validation at 20:31–20:36

After the user reported updating all components, both Cancel paths were verified
with recorder source `local_control` (commands issued through HA). The user
explicitly confirmed that Cancel at the active lid warning was pressed without
first pressing Select.

| Time | Sequence | Event |
| --- | --- | --- |
| 20:31:32.580 | 3495 | Active lid warning: `3010/A00S/qH/0D0` |
| 20:31:50.808 | 3510 | HA key 1 in `3010/A00S/qH/0D0` |
| 20:31:52.091 | 3512 | Device reports pause: `3010/A00F/ph/120` |
| 20:35:44.785 | 3726 | HA key 4 in `3010/A00F/ph/120` |
| 20:35:47.104 | 3728 | Device resumes: `3010/A00S/qH/000` |
| 20:36:36.449 | 3795 | HA key 1 in `3010/A00S/qH/000` |
| 20:36:38.412 | 3797 | Device reports pause: `3010/A00F/ph/120` |

This confirms normal lid Cancel (`qH/0D0`) and normal heating-to-boil Cancel
(`qH/000`) independently through HA. The intervening resume also reached qH/000.
Status responses have source `cloud`; both Cancel commands and the resume command
have source `local_control`. Final abort was separately verified through HA at
20:03; see [that run](ha-heating-abort-2026-11-18.md).

No new runtime changes or release are required for this validation. The upstream
PR remains deferred until the user declares testing complete.

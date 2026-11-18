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
and Bridge beta.14. HA hardware validation remains open. Do not generalize to the
editor-associated `0DT` lid warning or paused hop/completion states.

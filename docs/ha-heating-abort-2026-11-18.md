# HA heating-to-boil pause and final abort validated

November 18, 2026, user-operated Braumeister 20 L Plus, firmware 1.1.27.
The user reported updating to Card beta.37, Companion beta.24, Integration
beta.17 and Bridge beta.15, then testing both Cancel actions through HA.
Screenshots show the permanent-abort confirmation dialog and the resulting
main menu. The recorder confirms both commands with source `local_control`.

Times below are Europe/Berlin (UTC+01:00). Tuples are
state / button labels / actuator flags / indicator.

| Time | Sequence | Recorded event |
| --- | --- | --- |
| 20:02:59.226 | 1613 | Local key 1 from `3010/A00S/PH/000` |
| 20:03:01.189 | 1615 | Device reports pause: `3010/A00F/ph/120` |
| 20:03:39.386 | 1669 | Local key 1 from `3010/A00F/ph/120` |
| 20:03:41.385 | 1671 | Device reports main menu: `101/EMSR/ph/000` |

The status replies have source `cloud`; the key-bearing entries are
`local_control`. Thus the device replies corroborate the user's HA control test,
rather than merely showing a cloud button action. The confirmation dialog is
evidenced by the screenshot/user report, not by the device protocol itself.

Earlier in the same run, HA key 4 at sequence 1478 (20:01:42.098) acknowledged
`2910/Pi/010`, reaching `2930/pi/000` at 1480 (20:01:43.247). HA then confirmed
malt-pipe removal and boil start at sequences 1502 and 1537 respectively.

## Validation scope

- Confirmed through HA: normal heating-to-boil pause with source **PH/000**,
  and final abort from **ph/120**, including the user's confirmation dialog.
- Still pending: HA pause with **qH/000**, Cancel at the active lid warning
  **qH/0D0**, and the rest-end **pH target** variant. This run used PH for pause
  and pi as the rest-end target, so it does not validate those separate variants.
- Rest-end source **qi** remains unverified and rejected.

Documentation only. No runtime change, new release, real-device command by the
agent, raw capture publication, or upstream PR is part of this update.

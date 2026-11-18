# Boil editor follow-up: apparent temperature skip

User-operated Braumeister 20 L Plus, firmware 1.1.27. The user reported that
MySpeidel Select appeared to go directly to time editing. Screenshots show 18:08,
target 96 °C, actual approximately 85 °C, and a live duration of 10 minutes.

## Recorded sequence

The Bridge recorder timestamps below are converted from Unix time to
Europe/Berlin (UTC+01:00 on November 18, 2026). They are distinct from the time
shown in the screenshots. All editor key commands below have source `cloud`.
State remains `3010`, actuator flags `PH`, target field 4 `960`, and elapsed
field 7 `0`. No raw captures or device identifiers are published.

| Recorder time | Command sequence → resulting sequence | Observation |
| --- | --- | --- |
| 18:05:00.162 → 18:05:00.763 | 2139 key 4 → 2141 | `A00S/000` → `ADUS/00T` (temperature editor) |
| 18:05:06.540 → 18:05:07.095 | 2162 key 4 → 2164 | `ADUS/00T` → `ADUS/00Z` (time editor) |
| 18:05:23.468 → 18:05:23.979 | 2200 key 2 → 2202 | Duration field 6: 600 → 540 seconds |
| 18:05:24.796 → 18:05:25.311 | 2205 key 3 → 2207 | Duration: 540 → 600 seconds |
| 18:05:46.534 → 18:05:47.115 | 2248 key 4 → 2250 | `ADUS/00Z` → `A00S/000` (normal view) |
| 18:06:09.931 → 18:06:10.591 | 2272 key 4 → 2274 | `A00S/000` → `ADUS/00T` |
| 18:06:20.191 → 18:06:20.724 | 2304 key 4 → 2306 | `ADUS/00T` → `ADUS/00Z` |
| 18:06:22.425 → 18:06:22.964 | 2313 key 2 → 2315 | Duration: 600 → 540 seconds |
| 18:06:27.150 → 18:06:27.679 | 2329 key 3 → 2331 | Duration: 540 → 600 seconds |
| 18:06:43.152 → 18:06:43.758 | 2367 key 4 → 2369 | `ADUS/00Z` → `A00S/000` |

Between 18:07:00 and 18:09:59, 162 records (sequences 2405–2566) contain no
key commands. Status-bearing records show `3010/A00S/000`, target 960 and
duration 600. The 18:08 screenshot therefore does not establish the exact time
of the reported editing clicks. MySpeidel shows arrows in that screenshot,
whereas the captured device button labels in this recorder window are `A00S`.

## Conclusion and limits

The device did not skip the temperature-editor marker in either recorded cycle.
It reported `00T` for approximately 6.3 and 10.1 seconds before a separate
Select command moved to `00Z`. There are no Up/Down commands while `00T` is
active in these two cycles, so this capture does not test whether temperature
adjustment works there. Both time edits are confirmed as one-minute steps,
and the original duration is restored after each.

The discrepancy is between the reported/visible portal behavior and the device
status, not evidence for a new direct-to-time protocol transition. A delayed
portal refresh or a visually unclear selection is possible but unproven; the
recorder does not capture browser rendering. A follow-up should correlate one
Select click, the portal's selected field, and the next raw `00T` status before
another click. Do not implement a new editor-entry rule from this observation.

## HA controls validated in the same run

The user confirmed rest-end Select → remove malt pipe. Subsequent commands are
also visible with source `local_control`:

- 1829 key 4 → 1831: `2930/pi/000` → `2960/pi/000` (18:00:38–39).
- 1906 key 4 → 1908: `2960/pH/000` → `3010/PH/000` (18:01:42–43).
- 1962 key 1 → 1964: `3010/PH/000` → `3010/ph/120` (18:02:20–22).
- 2030 key 4 → 2032: `3010/ph/120` → `3010/PH/000` (18:03:23–25).

The editor-entry Select and final Cancel from this heating-stage pause remain
unavailable in HA. Pause/resume success does not validate final abort.

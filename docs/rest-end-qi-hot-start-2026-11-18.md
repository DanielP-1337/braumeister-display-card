# Rest-end qi: hot-start and pump-protection hypothesis

User-operated Braumeister 20 L Plus, firmware 1.1.27, November 18, 2026.
Times are Europe/Berlin. This is an observation and test plan, not a confirmed
decoding of actuator flags or authorization to expand control permissions.

## Evidence and hypothesis

The user restarted a brewing program with water still hot from an earlier run.
MySpeidel displayed a pump-shutdown notice stating shutdown at 88 °C and release
at 84 °C. Those thresholds are transcribed from the supplied device UI; they are
not independently established here for other firmware or hardware.

HA reported `2510/qi/010` at the pump-shutdown prompt (92 °C in the screenshot),
and `2910/qi/010` at rest end (84.5 °C in an earlier screenshot). The different
shutdown/release thresholds could explain why a protection-related state persists
while the water cools. The working hypothesis is that restarting above the pump
shutdown threshold can produce qi and retain it through short rests until release.
The exact meanings of q and i, and this causal relationship, remain unconfirmed.

Working interpretation of the individual flags (not a verified protocol definition):

- `q`: pump inhibited by temperature protection, consistent with the UI's shutdown
  threshold of 88 °C and release threshold of 84 °C.
- `i`: heater temporarily inactive because the target temperature has been reached
  or exceeded. A broader meaning such as a heating pause remains possible.
- `qi`: both conditions together; `qH` is consistent with pump protection while
  heating remains active.

Supporting follow-up: the user reported the pump stopping for protection and
supplied a Heating to boil screenshot at 88 °C. The recorder changed from
`3010/PH/000` (21:07:00.606, sequence 5700) to `3010/qH/000`
(21:09:59.084, sequence 5864), still present at 21:11:33.964. This correlation
supports the q hypothesis; it does not establish the exact definition of i or
prove Select from `2910/qi/010`. Do not broaden action guards from this hypothesis.

At 18:27:03, sequence 3695 reported `2910/qi/010`, but it changed to Pi before
the MySpeidel acknowledgment. That run does not prove a Select transition under qi.
The separate cloud acknowledgment at `2510/qi/010` also does not prove behavior
at state 2910.

In the cooler follow-up run, the rest-end screen showed approximately 78 °C.
The recorder showed PH/Pi rather than qi at that prompt:

| Time | Sequence | Observation |
| --- | --- | --- |
| 20:55:55.987 | 5055 | Rest end `2910/PH/010` |
| 20:56:45.680 | 5097 | Same prompt `2910/Pi/010` |
| 20:59:12.355 | 5217 | Same prompt `2910/PH/010` |
| 21:00:05.287 | 5258 | HA (`local_control`) key 4 at `2910/PH/010` |
| 21:00:06.570 | 5260 | Malt-pipe removal `2930/pH/000` |
| 21:00:08.116 | 5266 | Malt-pipe removal `2930/pi/000` |

This confirms a PH-source acknowledgment with a transient pH target through HA.
It does not verify the distinct Pi-source/pH-target combination or qi source.

## Focused test checklist

1. During a supervised water-only test, repeat the previously observed restart
   with water already above the UI's 88 °C shutdown threshold and the short-rest
   test recipe. Record initial actual temperature, recipe durations, and time.
   Leave pump protection and normal device controls unchanged; do not force flags
   or manually switch the pump/heater to manufacture qi.
2. Record the pump-shutdown prompt and how it was acknowledged. Let the short
   rests run normally. At "Mash rest complete," record temperature and time and
   inspect the live diagnostic state for exactly `2910/qi/010`.
3. If qi is present, press Select in HA once. Record the exact time, resulting
   screen, or full rejection diagnostic. A UI screenshot alone cannot establish
   the actuator flags at command dispatch.
4. If HA rejects it and the rest-end prompt is still active, acknowledge once
   through MySpeidel. Record time and resulting screen. Verify in the recorder
   that the cloud key-4 command itself still originated at `2910/qi/010`.
5. Capture the first resulting state/flags/indicator and subsequent stabilization.
   If flags changed to Pi or PH before the command, classify the run accordingly
   and leave qi open. Do not prolong or alter the process solely to force qi.

Acceptance evidence: a key-4 command at `2910/qi/010`, its command source, timestamp,
and observed target. A cloud-only result establishes protocol evidence; successful
HA validation remains a separate step after any narrowly scoped mapping change.
No runtime permission is changed by this document. The upstream PR remains deferred
until the user declares testing complete.

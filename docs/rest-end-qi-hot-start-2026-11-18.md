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

## Hot-start follow-up at 21:25–21:27

The next hot-start run reached rest end with qi still active. The supplied HA
screenshot at 21:26 shows an acknowledgment rejection for
`action=acknowledge_rest_end, screen=2910, actuators=qi, indicator=010` and an
actual temperature of 84 °C. The user subsequently reported that the pump resumed
after the water cooled below 84 °C and that another Select through HA succeeded.
The resulting malt-pipe-removal screenshot shows 83.5 °C.

| Time | Sequence | Recorder observation |
| --- | --- | --- |
| 21:25:26.038 | 6843 | Rest end `2910/qi/010` |
| 21:27:21.538 | 6939 | Same prompt changes to `2910/Pi/010` |
| 21:27:32.506 | 6946 | HA (`local_control`) key 4 at `2910/Pi/010` |
| 21:27:33.627 | 6948 | Malt-pipe removal `2930/pi/000` |

The recorder proves that qi changed to Pi before the successful HA command.
The below-84 °C pump-release observation comes from the user and screenshots;
the extracted status transitions above do not independently establish the exact
temperature at the instant of flag change. Together these observations support
the pump-protection hypothesis without establishing a formal flag definition.
The successful command validates the Pi path, not a direct qi acknowledgment.

## Optional follow-up test checklist

Scope update: the user classified this hot-start scenario as non-blocking for
the planned upstream protocol-documentation PR. Normal new-batch operation uses
cold water in their workflow. No additional artificial hot-start test is required
to finish that PR. The later claimed MySpeidel result was clarified to refer to
the same 21:27 HA Select after the change to Pi; it is not new qi evidence.
The following checklist is retained only for a future investigation.

1. During a supervised water-only test, repeat the previously observed restart
   with water already above the UI's 88 °C shutdown threshold and the short-rest
   test recipe. Record initial actual temperature, recipe durations, and time.
   Leave pump protection and normal device controls unchanged; do not force flags
   or manually switch the pump/heater to manufacture qi.
2. Record the pump-shutdown prompt and how it was acknowledged. Let the short
   rests run normally. At "Mash rest complete," record temperature and time and
   inspect the live diagnostic state for exactly `2910/qi/010`.
3. As agreed after the 21:27 run, acknowledge rest end directly through MySpeidel
   while qi is still active, without repeating the already observed HA rejection
   first. Record time and resulting screen. Verify in the recorder that the cloud
   key-4 command itself still originated at `2910/qi/010`; a screenshot alone
   cannot establish the actuator flags at command dispatch.
4. Capture the first resulting state/flags/indicator and subsequent stabilization.
   If flags changed to Pi or PH before the command, classify the run accordingly
   and leave qi open. Do not prolong or alter the process solely to force qi.

Acceptance evidence: a key-4 command at `2910/qi/010`, its command source, timestamp,
and observed target. A cloud-only result establishes protocol evidence; successful
HA validation remains a separate step after any narrowly scoped mapping change.
No runtime permission is changed by this document. The upstream PR remains deferred
until the user declares testing complete.

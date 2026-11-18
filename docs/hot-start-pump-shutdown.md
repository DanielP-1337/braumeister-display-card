# Hot-start pump shutdown — November 18, 2026

The user started another brewing process while the water was still hot. The
supplied screenshots show a 38 °C mash-in target and 87 °C actual temperature.
MySpeidel displays **Pump shutdown** and explains that the pump is switched off
as planned at 88 °C and released again at 84 °C. The card shows the pump-shutdown
message and a Braumeister notification. The user reports an audible alarm in
MySpeidel as well.

Treat these threshold values as text observed on this firmware/portal, not as
universal limits or newly measured switching points. Do not conflate the prompt
with a generic process pause or a fault solely because notification audio plays.

TODO:

- Correlate the notification, actuator flags and acknowledgment with a dedicated
  hot-start recording, including the actual switch-off/re-enable boundary.
- Display the contextual explanation in all eight languages, with appropriate
  notification styling distinct from a confirmed fault.
- Verify which prompt actions remain valid while the pump is temperature-limited.
  Do not extend the ordinary mash-temperature acknowledgment rule implicitly.

This observation does not change the narrowly scoped hop/Whirlpool/Cheers actions
in Display Card beta.28, Companion beta.18 and Bridge beta.10.

# Display Card 0.7.0-beta.35

Clear previous menu action feedback when the device screen, pause indicator, editor mode, or button context changes. Late service responses cannot restore feedback from a previous context, even if the device returns to the same screen. Pending requests remain locked until they finish.

Includes Companion 0.1.0-beta.22 with more precise rejection diagnostics. Recorded hop-addition and brewing-complete transitions already match supported rules; the earlier rejection could not be conclusively reproduced. This release does not broaden control permissions.

Update the Card and Companion, restart Home Assistant for the Companion, and reload the dashboard. Integration 3.2.1-beta.15 and Bridge 0.5.1-beta.13 remain unchanged.

Validation: Card regression suite, including context changes, unchanged telemetry, late responses, and pending-request locking.

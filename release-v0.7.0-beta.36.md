# Display Card 0.7.0-beta.36

Enable Cancel on the normal remove-lid warning to pause the program. Enable final Cancel on the heating-stage pause, retaining the explicit permanent-abort confirmation dialog. The two actions remain separate.

Bundle Companion 0.1.0-beta.23, which also accepts the hardware-observed hot-start mash acknowledgment with qi actuator flags. Requires Bridge 0.5.1-beta.14 (coordinated Integration 3.2.1-beta.16 package).

The editor-associated lid warning (0DT), boil editor controls, and final abort from hop/completion pauses remain unverified and unavailable. Automated tests cover dispatch, confirmation cancellation, unsupported contexts, exact Bridge telemetry confirmation, and existing safety gates. New HA paths still need hardware validation.

Update while idle; restart HA for the Companion and reload the dashboard. No upstream PR is opened by this release.

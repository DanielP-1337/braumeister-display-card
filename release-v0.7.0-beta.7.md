# Braumeister Display Card v0.7.0-beta.7 — device connection warning

- Optional `entities.connection_warning` mapping to the new **Check device
  connection** sensor in fork integration **3.1.1-beta.1**.
- Connection warning on every card tab; red when brewing or heater permission
  was last known active, including a heater regulation pause.
- Masks stale live values and blocks Bridge navigation/actuator controls while
  the mapped diagnostic is on, unknown, missing or unavailable. Verified recovery
  restores normal rendering. Smart-plug controls retain their existing behavior.
- Includes warning text in all eight bundled languages.
- Uses the temperature entity's actual unit label, including Fahrenheit.
- Preserves existing menu confirmations, button animation, lower tabs and opt-ins.

Download **v0.7.0-beta.7** from the existing HACS repository, then reload the
dashboard/browser. No HA restart is needed for the Card alone. Installing the
matching integration requires one HA restart; the Companion and Bridge do not
need an update. Add the new mapping to your existing `entities:` section, using
the actual diagnostic entity ID from your device. The Card remains compatible
without this optional mapping, but the heartbeat warning is then not enabled.

The release asset `braumeister-display-card.js` is the self-contained build with
all language catalogs. Keep one JavaScript module resource:
`/hacsfiles/braumeister-display-card/braumeister-display-card.js`.

Validation: six local Node scripts passed, including the new warning, recovery,
stale-value masking, control gating, manual-control metadata and Fahrenheit label
checks; syntax/build/diff checks passed. Hardware/HA disconnect testing is pending.
No device commands were sent for these tests. The warning cannot operate while
HA is stopped or the browser is disconnected from HA.

To roll back, redownload the previously installed Card version in HACS and reload
the browser. Save the current YAML first. No Bridge or Companion rollback needed.

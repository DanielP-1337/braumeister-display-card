# Local menu preview for Bridge PR #20

This preview adds opt-in menu buttons to the existing Braumeister Display Card.
The existing Speidel integration supplies screen state and sensor readings.
Use the Bridge build from PR #20 or a compatible build with the same control API.

1. Copy `custom_components/braumeister_menu` from this directory into HA's
   `/config/custom_components`. Add the following to `configuration.yaml` and
   check the configuration before restarting HA.

   ```yaml
   braumeister_menu:
     device_id: "YOUR_BRIDGE_DEVICE_ID"
   ```

   Use the exact device ID from the Bridge status API. Keep it in HA's backend
   configuration. Map the dashboard entities to that same Braumeister.
2. Install the built `dist/braumeister-display-card.js` as the dashboard
   JavaScript module and update the existing resource's cache-busting query.
   Keep the existing entity mappings, including the step and connection sensors.
3. Add `menu_control: true` to the card YAML. In the Bridge, enable
   `control_enabled` for the test. The companion expects the Bridge API on
   `127.0.0.1:8642` from Home Assistant Core.
4. As an HA administrator, test one transition at a time and compare the
   result with the device display. Start with opening and closing settings.
   For recipe navigation, open the picker from the card to populate the
   recipe names and highlighted position. Compare each move on the device.
5. To return to display-only mode, remove `menu_control` and disable
   `control_enabled` in the Bridge. Remove the companion configuration and
   component at the next HA restart if you no longer need them.

The companion submits each command once. It returns confirmed, expired,
unconfirmed, or screen changed when the Bridge supplies that outcome.
The card waits for HA telemetry before changing menus. Recipe names and
highlighting are snapshots obtained after a confirmed card action. Changes
made directly on the device can leave this snapshot behind until the next
confirmed card action.

The action allowlist covers settings, manual mode, recipe list, and opening,
navigating, and canceling the recipe picker. Pump, heater, temperature,
recipe confirmation, and brewing actions are outside the preview scope.

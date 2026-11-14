Recipe list recovery and mobile layout fixes.

- Map `entities.recipes` to the integration's device-recipe sensor to display its full list when the Companion returns incomplete recipe names. The Companion still supplies the selected slot. Unavailable or malformed sensor data falls back to the Companion.
- Center SVG icons for Cancel, Down, Up, Select and the footer, including the power icon on Android.
- Reduce the narrow-screen minimum height and remove recipe numbering. Nine recipes remain arranged in two columns, five on the left and four on the right.

Add the following to your existing card's `entities` mapping, replacing the placeholder with your device's recipe sensor:

```yaml
recipes: sensor.YOUR_DEVICE_recipes
```

Keep only one Braumeister Display JavaScript resource in HA; remove obsolete manual registrations if using HACS. Reload the browser or Companion App after updating.

All nine Node test scripts pass, including full-list recovery from a one-name Companion response, escaping, unavailable sensors and duplicate slot rejection. On-device S25 Ultra visual testing remains pending. The underlying incomplete Companion response is still under investigation; this beta uses the integration's existing complete recipe list.

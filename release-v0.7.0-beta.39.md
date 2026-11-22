## Frost warning button style

During a frost warning, all four navigation rings turn cyan and the display keys take on a rounded ice-blue finish. Your saved colors return when the warning clears. Device alarms and pauses still take priority.

The new **Use icy button colors during a frost warning** checkbox defaults to on. Clear it in the card editor to keep your usual buttons while the blue frame and frost message remain visible.

In HACS, select `v0.7.0-beta.39` for **Braumeister Display Card**, download it and reload the dashboard. To try the checkbox on a tablet, open the frost settings during an active warning and toggle it while watching the preview.

Existing beta.38 frost automations work with this release. For a new weather or phone notification setup, [import the blueprint](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FDanielP-1337%2Fbraumeister-display-card%2Fblob%2Fv0.7.0-beta.39%2Fblueprints%2Fbraumeister-frost-warning.yaml).

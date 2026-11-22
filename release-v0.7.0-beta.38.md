# Frost warning for delayed starts

Enable **Frost warning** in the card editor to show a quiet blue frame on the current tab when the water gets cold during an active start delay. The default threshold is 3 °C. Device alarms and pauses take priority. The warning is opt-in and does not operate the heater or pump.

1. In HACS, open **Braumeister Display Card**, select `v0.7.0-beta.38` from the available beta versions, download it and reload your dashboard.
2. For optional hourly forecasts and phone notifications, create a dedicated **Timer** helper and [import the frost warning blueprint](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FDanielP-1337%2Fbraumeister-display-card%2Fblob%2Fv0.7.0-beta.38%2Fblueprints%2Fbraumeister-frost-warning.yaml). Create an automation from it and choose the water temperature, current step, connection and timer entities.
3. Select a local weather entity with hourly forecasts and add your phone's notification action and message as desired. Select the same timer in the card editor. The automation can then warn even when the dashboard is closed. Each new warning sends one notification.

The JavaScript release asset is the HACS dashboard bundle. The YAML asset is also available for manual blueprint installation. [Setup guide](https://github.com/DanielP-1337/braumeister-display-card/blob/v0.7.0-beta.38/README.md#frost-warning-during-a-delayed-start).

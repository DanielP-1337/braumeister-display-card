# Display Card 0.7.0-beta.26

- Fill the existing black header divider yellow using the configured `entities.progress` percentage. Invalid, offline, and stale data leave it black. Labels are localized.
- Repeat enabled alarm audio every six seconds until the reported alarm/pause clears. The GUI can disable repetition. Mute sound silences only the current notification; it does not acknowledge or control the Braumeister. Browser audio permission is still required; test sound on each device. No MySpeidel audio file is included.
- Enable guarded Resume for the newly observed purge intermediate state 2310 and first-rest state 2810. Requires Menu Companion 0.1.0-beta.16 and Bridge 0.5.1-beta.8, plus existing control opt-ins.
- User confirmed prior sound output on notebook, phone, and tablet. New repeat/progress behavior still needs testing on those devices.

Update the Bridge while idle; update the Companion and restart HA if requested, update the card, and reload the browser. Never restart the Bridge during a brew.

# Hardware mapping TODO

- State 2705, Malt added?: test Up/Down directly on the Braumeister. The user observed no recognizable effect through MySpeidel. Both arrows remain disabled; record field changes and display text before mapping.
- Test the new HA direct-start and mash-prompt actions and Cancel at states 2510, 2610, 2705, 2810 and 2820. Cloud Select transitions are captured, but new HA paths are not yet hardware-verified.
- Automatic countdown expiry and later rest/boil editors remain unverified.
- Resume from a paused first rest (2810): user ended the test instead. Do not enable Resume before capturing the actual transition; final Cancel is mapped separately.
- Verify sound playback/unlock on FireHD and Hue color/restoration with the supplied blueprint.

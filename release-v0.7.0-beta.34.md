# Display Card 0.7.0-beta.34

Fix the old disabled preview masking dynamically mapped state-3010 actions.
The normal Heating to boil pause and lid acknowledgment now reach their mapped
buttons instead of the preview when the associated context is present.

Unsupported preview buttons now use the same faded appearance as other disabled
buttons. They no longer look active while showing a not-allowed cursor.

This does not enable the separate Boiling editor controls. Use Integration
3.2.1-beta.15, Companion 0.1.0-beta.21 and Bridge 0.5.1-beta.13 for the current
supported actions. No additional backend update is needed for this Card fix.

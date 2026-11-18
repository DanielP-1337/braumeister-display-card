# Display Card 0.7.0-beta.31

Requires Menu Companion 0.1.0-beta.19 and Bridge 0.5.1-beta.11.

- Enable guarded resume from the verified paused rest state 2820.
- Recognize the normal lid prompt 3010/qH/0D0 separately from the previously
  verified editor-associated lid prompt 3010/qH/0DT. Select acknowledges it;
  unverified lid Cancel remains unavailable.
- Enable pause at the hop prompt and guarded resume back to that prompt. This
  does not acknowledge the hop addition. Final abort from this pause remains
  unverified and unavailable.

These exact MySpeidel transitions were captured in the user's hardware test.
They still require testing through HA after updating all three components.
Heating-to-boil Cancel and the live temperature/time editor remain open work;
the recent Cancel test occurred after the device had reached the hop prompt.

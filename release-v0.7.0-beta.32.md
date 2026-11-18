# Display Card 0.7.0-beta.32

Requires Companion 0.1.0-beta.20 and Bridge 0.5.1-beta.12.

Add the newly verified Brewing complete screen: Select continues to Whirlpool;
Cancel pauses the completion prompt, and guarded Resume returns to that prompt.
Only the two buttons reported by the device are shown here. Final abort from
this pause remains unverified.

Includes beta.31's timed-rest resume, normal lid acknowledgment and hop-prompt
pause/resume fixes. Heating-to-boil controls remain separate open work.

The user confirmed Whirlpool and Cheers through HA on real hardware on November
18. The new completion actions are based on observed MySpeidel transitions and
automated tests; their HA hardware validation is still pending.

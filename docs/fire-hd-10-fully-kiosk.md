# Amazon Fire HD 10 with Fully Kiosk Browser

This setup displays the Braumeister dashboard in portrait orientation, without
the Home Assistant header or sidebar. Fully's PIN-protected menu remains
available. The changes are local to the tablet; desktop browsers and the card's
Home Assistant configuration are unaffected.

## Verified setup

Verified on 2026-11-20 with an advertising-supported Fire HD 10, model KFTUWI,
Fire OS 8.3.3.8 (Android 11), and Fully Kiosk Browser 1.61.4 with an existing
PLUS license. The user confirmed that the dashboard and portrait lock worked.
This records one installation, not compatibility with every Fire OS release or
every display-card release. The tablet was running an existing Braumeister
dashboard; the card itself was not upgraded as part of this setup.

The Home Assistant server had a DHCP reservation in a Speedport router. The
dashboard path was `/firehd-braumeister/braumeister_tablet`. Substitute your own
host and path throughout this guide. No account password, kiosk PIN, license
key, or device serial number belongs in the repository.

## Install and connect

1. Enable developer options by tapping the tablet's serial number seven times,
   enable USB debugging, and approve the computer on the tablet.
2. Run `adb devices -l`. Continue only when the selected tablet says `device`,
   rather than `unauthorized`. Use `adb -s SERIAL ...` when multiple devices
   are connected.
3. Install the regular APK from the [official Fully download page](https://www.fully-kiosk.com/docs/en/getting-started/downloads).
   Fully's [Fire OS instructions](https://www.fully-kiosk.com/docs/en/faq/fire)
   specify the regular APK edition. An existing installation can be updated
   using `adb install -r Fully-Kiosk-Browser-vVERSION.apk`, preserving app data.
4. Open Fully and set **Settings > Web Content Settings > Start URL** to your
   complete dashboard URL, for example:

   ```text
   http://192.168.1.100:8123/firehd-braumeister/braumeister_tablet
   ```

5. Log in to Home Assistant directly on the tablet if prompted. Fully's HTTP
   Basic Authentication fields are not the Home Assistant login form.

### If `homeassistant.local` fails

The tested tablet returned `net::ERR_NAME_NOT_RESOLVED` for
`homeassistant.local`, even though that name worked on the notebook. The same
dashboard loaded successfully using the server's reserved LAN IP address.
Use a router DHCP reservation so this address remains stable.

This observation establishes a tablet-side name-resolution failure, not an
AdGuard filtering diagnosis. AdGuard settings were not changed. Home Assistant
uses [mDNS/Zeroconf for local discovery](https://contributors.home-assistant.io/core/internals/instance-discovery/);
name resolution can differ between clients.

## Fully settings

| Settings section | Option | Value |
| --- | --- | --- |
| Device Management | Keep Screen On | On |
| Device Management | Launch on Boot | On |
| Device Management | Screen Off Timer | `0` (disabled) |
| Web Auto Reload | Auto Reload after Page Error | `30` seconds |
| Web Auto Reload | Auto Reload on Network Reconnect | On |
| Web Auto Reload | Delete Cookies / Webstorage on Auto Reload | Off |
| Kiosk Mode (PLUS) | Disable Screen Off | **Off** (allow the physical power button) |
| Kiosk Mode (PLUS) | Disable Volume Buttons | **Off** (allow adjusting dashboard alarm audio) |
| Motion Detection (PLUS) | Enable Visual Motion Detection | **Off** (no camera-triggered wake-up) |
| Device Management | Unlock Screen | **On** (verified with HA screen-on command) |
| Device Management | Unlock Swipe Screen Lock | **On** (alone was insufficient on this Fire OS) |

In the verified installation **Keep Screen On (Advanced)** was also already
enabled and retained. The previous 42-second Screen Off Timer was disabled.
Keeping the screen on avoids returning to the advertising lock screen during
normal dashboard use; this does not remove Amazon's ads. Manual screen-off was
subsequently tested as described below. Scheduled sleep was not validated.

## Kiosk protection and exit

Under **Settings > Kiosk Mode (PLUS)**:

1. Enable **Kiosk Mode** and choose your own **Kiosk Mode PIN**.
2. Set **Kiosk Exit Gesture** to **Swipe from Left Edge (in Fully)**.
3. Grant Fully's requested **Accessibility Service** and **Usage Data Access**.
   On Fire OS these let Fully detect and block navigation to other apps.
4. Keep **Disable Home Button**, **Disable Other Apps**, **Disable Status Bar**,
   **Disable System Dialogs**, and **Disable Context Menus** enabled. Leave
   **Disable Volume Buttons off** so the alarm volume can be adjusted. Keep
   **Disable Screen Off disabled** if the physical power button should turn the display off.
5. Accept Fully's restart into kiosk mode. Test the Home button and the exit
   gesture before relying on the tablet unattended.

To reach settings: swipe from the **outermost left edge to the right**, enter
your PIN, and choose **Settings**. Closing the menu restores the PIN gate.
To remove the kiosk lock, turn off **Enable Kiosk Mode** there. The PIN can be
changed under **Kiosk Mode PIN**. Keep it somewhere accessible to the owner.

The Home-button test returned to/stayed in Fully, and the PIN exit was verified
on the test device. Amazon's launcher was not disabled. Fire OS can change this
behavior after updates; a full device-reboot recovery test was not performed.

**Recovery observed during setup:** after `adb shell am force-stop
de.ozerov.fully` and a subsequent launch, Fire OS had removed Fully's
accessibility-service enablement. Re-enable **Fully Kiosk Browser** in Android
**Accessibility** settings and test Home again. Do not overwrite the complete
list of accessibility services if other services are in use.

### Power button immediately wakes the screen and shows ads

A follow-up test exposed two conflicting settings in the initial configuration:

- **Kiosk Mode > Disable Screen Off** was enabled. Fully explicitly documents
  that this option wakes the display shortly after a short power-button press.
- **Motion Detection > Enable Visual Motion Detection** was also enabled, with
  background detection active. Turning off only Disable Screen Off did not fix
  the symptom; Android's power diagnostics recorded `fully:WakeUpLock`.

Both options were switched off. Acoustic/proximity motion detection and device
movement detection were already disabled and remained so. Keep Screen On and
Keep Screen On (Advanced) were retained: the dashboard stays awake while in use,
but manual screen-off is now allowed. Following an ADB `KEYCODE_POWER` event,
the tablet reported `mWakefulness=Asleep`, `mLastSleepReason=power_button`, and
`Display Power: state=OFF` after five seconds. This replaces the initial
recommendation to leave Disable Screen Off enabled.
An additional `KEYCODE_SLEEP` test still reported `Asleep` / `OFF` after
20 seconds, and the user confirmed the display was off. An intervening wake
event was logged as a power-key event rather than Fully's wake lock.

This configuration deliberately does not wake the display when someone walks
past the front camera. Wake it manually with the power button. Amazon's
advertising lock screen is still enabled and can appear when waking the tablet;
this correction does not remove ads or guarantee bypass of the lock screen.
See Fully's [Kiosk Mode option descriptions](https://www.fully-kiosk.com/docs/en/configuration/kiosk-mode).

### Home Assistant screen control and the advertising lock screen

The official [Fully Kiosk integration](https://www.home-assistant.io/integrations/fully_kiosk/)
was subsequently added using the tablet's LAN address and its **Remote Admin
Password**, which is separate from the kiosk PIN. Enable **Remote Administration**
and **Remote Admin from Local Network** in Fully. Leave the settings screen after
saving the password, then check the local Remote Admin service on port 2323.
Reserve the tablet's IP address in the router for reliable operation.

HA's screen switch was tested against Android's actual power state: off produced
`Asleep`, on produced `Awake`. Initially wake-up still showed the Amazon ad screen.
**Unlock Swipe Screen Lock alone did not fix this.** Enabling **Unlock Screen** as
well made the Braumeister dashboard appear after HA wake-up, without a manual or
ADB swipe. Both options remain enabled. This shows Fully above the lock screen;
it does not uninstall or disable Amazon's advertising components. Behavior after
a complete tablet reboot was not tested.

Fully also repeatedly requested permission to install apps from APK files after
Remote Admin was enabled. On this installation, **IGNORE** dismissed that request
without granting APK installation permission; HA screen control still worked.

### Power-based display automation

The tested smart plug reported **0 W with the Braumeister switched off**, and
approximately **2.78–2.97 W with it on but heater and pump off**. These measurements
belong to this particular installation; measure your own plug and machine before
choosing thresholds.

The installed automation uses the following rules:

- Valid consumption **below 0.5 W for 30 seconds** turns off the tablet and arms
  the next automatic wake. Network disconnection never counts as power-off.
- Valid consumption **above 1.5 W**, Braumeister online, a new device timestamp
  since the measured power-off, and Fully reachable for **5 seconds** consume
  the permission and turn the tablet on once.
- A persistent `input_boolean` stores that permission with **Restore previous
  state** selected. It is consumed **before** sending the screen-on command;
  failed commands and reconnects cannot repeatedly wake the tablet.
- A persistent `input_text` stores `last_device_timestamp` from the integration's
  device-connection diagnostic sensor at power-off. Wake-up requires a larger
  timestamp. The ordinary online/last-online values kept updating while the
  machine was physically off in this test; they are insufficient evidence of a
  new connection. Use the device timestamp, not a cloud polling timestamp.
- Manual tablet power-off after that wake stays off until the next measured
  Braumeister off/on cycle. Manual tablet power-on remains available.
- Unknown, unavailable, non-numeric and negative consumption never mean off.
  No automation action controls the smart-plug relay, heater or pump.

Automatic wake, a manual tablet-off period of more than one minute with the
Braumeister still online, consumption-based screen-off/rearming, and a second
automatic wake with a new device timestamp were verified. HA polls Fully's state every
30 seconds, so status updates can lag the physical buttons. The persistent helper
prevents repeated wake-ups after a consumed wake independently of that delay.
A manual off during the short window *before the first automatic wake* can still
race that polling interval. A complete HA restart was not tested; the helper's
restore setting was verified. Trigger hold timers restart on automation reload or
HA restart, and cycles that occur entirely while HA is offline are not inferred.

### Volume buttons and dashboard alarm audio

The initial kiosk setup had **Disable Volume Buttons** enabled. A user report
identified that the hardware buttons are needed for alarm volume. This setting
was switched off without disabling the remaining kiosk protections.

The dashboard's **Test / enable sound** button was used for a short audio test.
During playback, a simulated Volume Up key changed Android's `STREAM_MUSIC`
(speaker) from 9 to 10 out of 25. Volume Down also reduced that stream, and the
original media level of 9 was restored afterward. The test verified volume-key
handling during dashboard audio; it did not trigger a brewing process or test
a real brewing alarm. Confirm the desired audible level on the installed tablet.

Use the dashboard test tone when adjusting volume: without active playback,
Android may route volume keys differently. A web dashboard sound uses media
audio; do not assume the Android alarm-volume slider controls it. Kiosk exit
and Home-button protections remain independent of the volume-button setting.

## Hide the Home Assistant header and sidebar on this tablet

Fully's device kiosk lock does not itself remove Home Assistant's web navigation.
Use Fully's [Inject JavaScript option](https://www.fully-kiosk.com/docs/en/configuration/advanced-web)
for the tablet-only display adaptation supplied with this guide:

1. Download [fully-dashboard-only.js](../examples/fully-kiosk/fully-dashboard-only.js).
   Replace `HA_HOST:8123` with the host and port of your Start URL. Adjust the
   `/firehd-braumeister/` path prefix if your dashboard uses another path.
2. Create a JSON import containing **only** `injectJsCode`. For example, in
   PowerShell, from the directory containing the downloaded script:

   ```powershell
   $code = Get-Content -LiteralPath './fully-dashboard-only.js' -Raw
   @{ injectJsCode = $code } | ConvertTo-Json |
     Set-Content -LiteralPath './fully-dashboard-only.json' -Encoding utf8
   adb push ./fully-dashboard-only.json /sdcard/Download/fully-dashboard-only.json
   ```

3. In Fully, open **Settings > Other Settings > Import Settings**, choose
   **Downloads > fully-dashboard-only.json**, and import it. If there is already
   custom code in **Advanced Web Settings > Inject JavaScript**, back it up and
   merge the two scripts first; importing replaces that one setting.
4. Leave settings and reload the Start URL. If a restart is necessary, recheck
   the accessibility permission described above.
5. Verify that the HA title bar, hamburger button, and sidebar are absent, while
   the Braumeister display and its own controls remain visible. Check the Fully
   exit gesture as well.

The file import is preferred to `adb shell input text` for this long value:
direct text injection dropped/truncated characters on the test device. The
script does not require enabling Fully's separate **JavaScript Interface**.

The script inserts CSS into Home Assistant's shadow DOM and periodically checks
for newly rendered layout elements. It removes the navigation's reserved space
as well as hiding the elements. It does not alter the card's buttons or issue
brewing commands. The origin/path check limits where it initially applies;
styles can remain during same-document Home Assistant navigation until a full
page reload. This is a visual adaptation, **not an authorization boundary** or
a substitute for Home Assistant user permissions.

Home Assistant frontend updates can change these internal selectors. If the
layout breaks, remove the code from **Inject JavaScript** and fully reload the
page. To clear just this setting by file import, use:

```json
{"injectJsCode": ""}
```

The script was checked on the tablet after a Fully restart: the HA header and
sidebar were absent, the Braumeister controls remained, and the Fully PIN prompt
still appeared. The notebook view was not modified.

## Lock portrait orientation

On the tested KFTUWI the display's natural orientation is 1200 x 1920. The final
mounting uses **reverse portrait (180 degrees), with the USB connector at the
bottom**: rotation `2`. Rotation `0` selects the opposite portrait orientation.
Read the current values before changing them:

```sh
adb shell settings --user 0 get system accelerometer_rotation
adb shell settings --user 0 get system user_rotation
adb shell settings --user 0 put system accelerometer_rotation 0
adb shell settings --user 0 put system user_rotation 2
```

These persistently disable sensor rotation and select reverse portrait for user 0.
Leave Fully's **Screen Orientation** on the system/default choice rather than
forcing a conflicting landscape orientation. On this device the active Fully
window used unspecified orientation, and the final display was verified as
1200 x 1920 with rotation 2 after the mounting correction. To restore automatic rotation:

```sh
adb shell settings --user 0 put system accelerometer_rotation 1
```

Portrait locking changes orientation, not the display-card layout or scaling.
Do not assume rotation 0 is portrait on other tablet models.

## Optional Amazon app cleanup performed on the test tablet

These eight packages were disabled for **user 0 only**, without deleting data:

| App | Package |
| --- | --- |
| Amazon Shopping | `com.amazon.windowshop` |
| Amazon Music | `com.amazon.mp3` |
| Prime Video | `com.amazon.avod` |
| Kindle | `com.amazon.kindle` |
| Audible | `com.audible.application.kindle` |
| Freevee / IMDb TV | `com.amazon.imdb.tv.mobile.app` |
| Weather | `com.amazon.weather` |
| Fire Channels | `com.amazon.hedwig` |

This is optional and not a requirement for the card or Fully. Each app loses its
normal functionality for that user. Identify packages on your own device before
using `adb shell pm disable-user --user 0 PACKAGE`; restore one with
`adb shell pm enable --user 0 PACKAGE`. The observed result is not a blanket
guarantee for other Fire OS builds.

Amazon Photos, Silk, customer support, generative wallpaper, Appstore, launcher,
account services, OTA/security updates, parental controls, and advertising
packages were left enabled. In particular, `com.amazon.webview.chromium` was
the active WebView provider and was retained. No rooting, factory reset, or
system-app deletion was needed.

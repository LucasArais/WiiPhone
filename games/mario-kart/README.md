# 🏎️ Mario Kart

A lightweight kart racer controlled by tilting your phone.

## Controls

| Action | How |
| --- | --- |
| Steer | Tilt your phone left/right (hold it flat, screen up) |
| Accelerate | Automatic — your kart always drives forward |
| Boost | Drive over a yellow dash pad on the track |

No phone handy? Use the **← →** arrow keys on the computer to steer instead.

## How it works

- The kart, track and CPU racers are all built from primitive Three.js
  geometry at runtime — no external 3D models to download or license.
- Steering comes from the phone's `deviceorientation` gamma angle,
  calibrated to whatever angle you were holding the phone at when you tapped
  **Enable motion sensors** (see [`core/motion.js`](../../core/motion.js)).
- The track boundary is enforced by projecting the kart's position onto the
  nearest point of the track's centerline curve and clamping it if it drifts
  too far sideways.
- 3 CPU racers follow the track centerline at slightly different speeds.
  First to complete 3 laps wins.

## Race format

- 1 human player (phone) + 3 CPU racers
- 3 laps, single track

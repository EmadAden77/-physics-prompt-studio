# LHD Spatial Anchor Manual Prompt Fixtures

These three fixtures test the same canonical Saudi LHD topology at increasing prompt detail. Success means the final generated image keeps the driver in the physical front-left seat, a small steering cue in the lower-left of the final frame, the center console progressing rightward, and the empty front passenger seat on the right, with no horizontal flip.

## 1) Short

```text
Nighttime genuine front-camera selfie inside a parked Saudi-market LEFT-HAND-DRIVE 2017 Range Rover Sport L494. The driver is physically seated in the FRONT-LEFT driver seat and holds the selfie camera in his LEFT hand at normal arm reach; the phone and arm stay outside the crop. FINAL IMAGE coordinates are authoritative: driver-side door/window on the LEFT, a small unmistakable steering-rim segment in the LOWER-LEFT, driver/instrument axis behind it, center console toward the RIGHT, and the EMPTY front passenger seat on the RIGHT. No steering wheel on the right, no RHD layout, no horizontal mirror/flip, no reversed cabin, no passenger-seat-as-driver substitution. Real Saudi night practical lighting only, physically localized falloff, ordinary smartphone low-light noise, no studio light.
```

## 2) Medium

```text
Generate a photorealistic subject-held Xiaomi 15 Ultra FRONT-CAMERA selfie at night inside a parked 2017 Range Rover Sport Autobiography Dynamic L494 in Saudi Arabia. This is a canonical LEFT-HAND-DRIVE cabin. The subject occupies the physical FRONT-LEFT DRIVER SEAT and holds the phone in his LEFT hand at normal selfie distance; phone, hand, wrist, forearm and elbow remain outside frame.

FORCED FINAL-FRAME ORDER, LEFT TO RIGHT: driver-side door/window at image LEFT -> driver seated on the steering axis -> small steering-rim segment in the LOWER-LEFT quadrant -> instrument cluster directly behind/above that steering axis -> center stack and center console progressing toward image RIGHT -> EMPTY front passenger seat on image RIGHT -> passenger-side door/window at far right if visible.

The wheel cue is mandatory but small; crop the hub and most spokes. Dashboard must be asymmetric and physically coherent: driver cluster left, central infotainment to its right, passenger/glovebox area farther right. If a mirror is visible, the driver-side mirror stays attached to the left door/window geometry. NO steering wheel on the right, NO RHD, NO horizontal flip or mirrored selfie preview, NO duplicated wheel, NO center steering, NO passenger seated as driver. Night illumination comes only from visible Saudi practical sources with real occlusion and falloff; exposure cannot invent cabin light.
```

## 3) Detailed / Forensic

```text
GENERATE ONE PHOTOREALISTIC IMAGE — CANONICAL SAUDI LHD SPATIAL TEST.

CAPTURE LOCK:
A genuine subject-held Xiaomi 15 Ultra FRONT-CAMERA selfie at night. The vehicle is parked and stationary. The driver holds the camera in his LEFT hand at normal arm reach, approximately 48–55 cm from the face. The phone, holding hand, wrist, forearm and elbow remain completely outside the crop. Never render a third-person viewpoint.

VEHICLE:
2017 Range Rover Sport Autobiography Dynamic L494, Saudi-market LEFT-HAND DRIVE, restrained Ebony/Ivory interior with period-correct dashboard and steering wheel.

FINAL-IMAGE COORDINATE SYSTEM — ABSOLUTE:
Do not infer seat position from a mirrored phone preview. Do not horizontally reverse the generated image. Treat these as literal final-image positions.

LEFT EDGE -> driver-side door/window and only-if-visible driver-side mirror -> subject seated in the physical FRONT-LEFT DRIVER SEAT -> small unmistakable steering-rim segment in the LOWER-LEFT quadrant -> instrument cluster directly behind/above the steering axis -> central infotainment/controls -> center console extending toward image RIGHT -> EMPTY front passenger seat on image RIGHT -> passenger-side door/window at far RIGHT if reached by the crop.

FORCED PERSPECTIVE:
The camera origin remains inside the driver's space, slightly left of the driver's face. It must never migrate across the center console into passenger space. The steering wheel stays physically ahead of the driver torso, never ahead of the passenger seat. The small lower-left rim cue is mandatory; keep hub and most spokes cropped so it proves occupancy without dominating the selfie.

DASHBOARD TOPOLOGY:
Driver instrument cluster on the left steering axis. Center infotainment and controls immediately to its right. Passenger dashboard/glovebox farther right in front of the empty passenger seat. No symmetric fantasy dashboard and no steering column crossing the console.

STRICT NEGATIVES:
NO steering wheel on the right side of the cabin or final image. NO right-hand-drive layout. NO UK/Japan/Australia cabin topology. NO horizontal mirroring or flipping. NO mirrored selfie-preview logic. NO reversed cabin. NO front-right passenger used as the driver. NO duplicated steering wheel. NO center-mounted wheel. NO duplicated console. NO passenger seat on image LEFT in this canonical driver-selfie layout.

LIGHTING:
Saudi night only. Use physically visible practical sources such as station canopy lights, storefront fixtures or parking lights according to the selected location. Each source has localized reach, occlusion, shadow direction and falloff. The cabin remains dimmer than the exterior. Exposure/ISO/HDR may reveal existing sensor signal but may not create illumination that never reached the subject or cabin.

FINAL QA:
Before accepting the image, trace the visible topology in this exact order: image LEFT driver door/window -> driver/front-left seat -> lower-left steering cue -> driver instrument axis -> center console -> empty passenger seat RIGHT -> passenger door/window. If any element reverses, if the wheel appears on the right, or if the cabin looks horizontally flipped, reject the result and rebuild from scratch.
```

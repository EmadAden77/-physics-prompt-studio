export const PRESETS = Object.freeze([
  {
    id: 'rrs-2017-night-selfie',
    label: 'داخل رنج روفر 2017 بيضاء / سيلفي ليلي',
    values: {
      captureType: 'front-selfie', time: 'night', location: 'public-parking', vehicleScene: 'rrs-2017-white-interior',
      people: '1', ratio: '9:16', age: 35, pose: 'natural-seated', expression: 'neutral',
      clothing: 'navy-shirt', hair: 'short-natural', beard: 'clean-shaven', glasses: 'none', framing: 'chest-up',
      focalLength: 24, distance: 50, yaw: 0, pitch: 0, roll: 2,
      lightSource: 'parking-lights', lightDirection: 'mixed', lightFalloff: 'mixed-local',
      exposure: 'natural', hdr: 'low', whiteBalance: 'neutral-small-error'
    }
  },
  {
    id: 'night-selfie',
    label: 'سيلفي ليلي عفوي',
    values: {
      captureType: 'front-selfie', time: 'night', location: 'commercial-street', vehicleScene: 'none',
      people: '1', ratio: '9:16', age: 35, pose: 'natural-standing', expression: 'neutral',
      clothing: 'black-tee', hair: 'short-natural', beard: 'clean-shaven', glasses: 'none', framing: 'chest-up',
      focalLength: 24, distance: 50, yaw: 0, pitch: 0, roll: 2,
      lightSource: 'street-lights', lightDirection: 'mixed', lightFalloff: 'mixed-local',
      exposure: 'natural', hdr: 'low', whiteBalance: 'neutral-small-error'
    }
  },
  {
    id: 'commercial-night',
    label: 'شارع تجاري ليلًا',
    values: {
      captureType: 'candid', time: 'night', location: 'local-shops', vehicleScene: 'none',
      people: '1', ratio: '4:5', age: 35, pose: 'natural-standing', expression: 'neutral',
      clothing: 'navy-shirt', hair: 'short-natural', beard: 'clean-shaven', glasses: 'none', framing: 'half-body',
      focalLength: 35, distance: 150, yaw: 0, pitch: 0, roll: 0,
      lightSource: 'shop-signage', lightDirection: 'mixed', lightFalloff: 'mixed-local',
      exposure: 'natural', hdr: 'low', whiteBalance: 'neutral-small-error'
    }
  },
  {
    id: 'majlis',
    label: 'مجلس حديث',
    values: {
      captureType: 'front-selfie', time: 'evening', location: 'modern-majlis', vehicleScene: 'none',
      people: '1', ratio: '9:16', age: 35, pose: 'natural-seated', expression: 'neutral',
      clothing: 'white-thobe', hair: 'short-natural', beard: 'clean-shaven', glasses: 'none', framing: 'chest-up',
      focalLength: 24, distance: 50, yaw: 0, pitch: -6, roll: 2,
      lightSource: 'majlis-light', lightDirection: 'mixed', lightFalloff: 'mixed-local',
      exposure: 'natural', hdr: 'low', whiteBalance: 'slightly-warm'
    }
  },
  {
    id: 'day-candid',
    label: 'لقطة عفوية نهارية',
    values: {
      captureType: 'candid', time: 'afternoon', location: 'residential-street', vehicleScene: 'none',
      people: '1', ratio: '4:5', age: 35, pose: 'walking', expression: 'neutral',
      clothing: 'white-tee', hair: 'short-natural', beard: 'clean-shaven', glasses: 'none', framing: 'half-body',
      focalLength: 35, distance: 150, yaw: 0, pitch: 0, roll: 0,
      lightSource: 'daylight', lightDirection: 'side', lightFalloff: 'distant-uniform',
      exposure: 'natural', hdr: 'low', whiteBalance: 'neutral-small-error'
    }
  },
  {
    id: 'indoor-portrait',
    label: 'بورتريه داخلي طبيعي',
    values: {
      captureType: 'third-person', time: 'evening', location: 'living-room', vehicleScene: 'none',
      people: '1', ratio: '4:5', age: 35, pose: 'natural-seated', expression: 'neutral',
      clothing: 'navy-shirt', hair: 'short-natural', beard: 'clean-shaven', glasses: 'none', framing: 'head-upper-torso',
      focalLength: 50, distance: 180, yaw: 0, pitch: 0, roll: 0,
      lightSource: 'warm-room-light', lightDirection: 'front-side', lightFalloff: 'distributed-soft',
      exposure: 'natural', hdr: 'low', whiteBalance: 'slightly-warm'
    }
  },
  {
    id: 'villa-evening',
    label: 'مدخل فيلا مساءً',
    values: {
      captureType: 'front-selfie', time: 'evening', location: 'villa-entrance', vehicleScene: 'none',
      people: '1', ratio: '9:16', age: 35, pose: 'natural-standing', expression: 'neutral',
      clothing: 'navy-shirt', hair: 'short-natural', beard: 'clean-shaven', glasses: 'none', framing: 'chest-up',
      focalLength: 24, distance: 52, yaw: 8, pitch: 0, roll: 2,
      lightSource: 'security-light', lightDirection: 'front-side', lightFalloff: 'inverse-square-near',
      exposure: 'natural', hdr: 'low', whiteBalance: 'neutral-small-error'
    }
  }
]);

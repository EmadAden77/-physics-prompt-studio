export const PRESETS = [
  {
    id: 'rrs-2017-night-selfie',
    label: 'داخل رنج روفر 2017 بيضاء / سيلفي ليلي',
    values: {
      vehicleScene: 'rrs-2017-white-interior',
      captureType: 'front-selfie', time: 'night', location: 'public-parking',
      people: '1', ratio: '9:16 vertical', age: '35', pose: 'natural-seated', expression: 'neutral',
      clothing: 'navy-shirt', angle: 'eye-level', framing: 'chest-up', focalLength: '24', distance: '50',
      yaw: '0', pitch: '0', roll: '2', lightSource: 'parking-lights',
      lightDirection: 'front-side natural direction', lightFalloff: 'natural distance-based falloff',
      exposure: 'natural', hdr: 'low', whiteBalance: 'neutral with small natural error',
      idea: 'A 35-year-old man is seated inside a white 2017 Range Rover Sport parked at night in a generic Saudi parking area.'
    }
  },
  {
    id: 'night-selfie',
    label: 'سيلفي ليلي عفوي',
    values: {
      captureType: 'front-selfie', time: 'night', location: 'commercial-street',
      angle: 'off-center', framing: 'chest-up', focalLength: '24', distance: '50',
      yaw: '0', pitch: '0', roll: '2', lightSource: 'street-lights',
      lightDirection: 'front-side natural direction', lightFalloff: 'natural distance-based falloff',
      exposure: 'natural', hdr: 'low', whiteBalance: 'neutral with small natural error'
    }
  },
  {
    id: 'commercial-night',
    label: 'شارع تجاري ليلًا',
    values: {
      captureType: 'candid', time: 'night', location: 'local-shops',
      angle: 'eye-level', framing: 'half-body', focalLength: '26', distance: '180',
      lightSource: 'shop-signage', lightDirection: 'mixed practical directions',
      lightFalloff: 'localized practical-light falloff', exposure: 'natural', hdr: 'low'
    }
  },
  {
    id: 'majlis',
    label: 'مجلس حديث',
    values: {
      captureType: 'front-selfie', time: 'evening', location: 'modern-majlis',
      pose: 'natural-seated', angle: 'slightly-low', framing: 'chest-up',
      focalLength: '24', distance: '50', lightSource: 'majlis-light',
      lightDirection: 'mixed practical directions', lightFalloff: 'broad soft falloff'
    }
  },
  {
    id: 'day-candid',
    label: 'لقطة عفوية نهارية',
    values: {
      captureType: 'candid', time: 'afternoon', location: 'residential-street',
      pose: 'walking', angle: 'eye-level', framing: 'half-body', focalLength: '28',
      distance: '220', lightSource: 'daylight', lightDirection: 'side direction',
      lightFalloff: 'natural distance-based falloff', exposure: 'natural', hdr: 'low'
    }
  },
  {
    id: 'indoor-portrait',
    label: 'بورتريه داخلي طبيعي',
    values: {
      captureType: 'third-person', time: 'evening', location: 'living-room',
      pose: 'natural-seated', angle: 'eye-level', framing: 'head-upper-torso',
      focalLength: '50', distance: '180', lightSource: 'warm-room-light',
      lightDirection: 'front-side natural direction', lightFalloff: 'broad soft falloff'
    }
  },
  {
    id: 'villa-evening',
    label: 'مدخل فيلا مساءً',
    values: {
      captureType: 'front-selfie', time: 'evening', location: 'villa-entrance',
      pose: 'natural-standing', angle: 'slight-right-offset', framing: 'chest-up',
      focalLength: '24', distance: '52', lightSource: 'security-light',
      lightDirection: 'front-side natural direction', lightFalloff: 'localized practical-light falloff'
    }
  }
];

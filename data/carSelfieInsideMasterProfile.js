export const INSIDE_DRIVER_MASTER_PROFILE = Object.freeze({
  id: 'inside-driver-master-v1',
  label: 'Master Inside Driver Profile',
  appliesTo: Object.freeze({ mode: 'inside', seat: 'driver-left' }),
  identityPolicy: Object.freeze({
    referenceRole: 'identity-only',
    preserve: Object.freeze([
      'overall face shape and head proportions',
      'forehead shape and width',
      'eyebrow shape, thickness, spacing and natural asymmetry',
      'eye shape, eyelids, spacing, size and natural asymmetry',
      'nose bridge, width, tip and nostril geometry',
      'lips, philtrum, mouth width and resting-mouth anatomy',
      'jawline, chin and visible ears',
      'natural skin tone and apparent age',
      'hairline, hair density, strand distribution and irregularities',
      'beard density, beard gaps, moustache pattern and cheek-line shape',
      'natural left-right facial asymmetry'
    ]),
    neverCopy: Object.freeze(['background', 'lighting', 'pose', 'framing', 'clothing', 'expression', 'body orientation']),
    forbidBeautification: true
  }),
  captureLock: Object.freeze({
    captureMode: 'handheld-front',
    device: 'Xiaomi 15 Ultra',
    camera: 'front',
    focalLengthEqMm: 21,
    aperture: 2.0,
    distanceCm: 45,
    yawDeg: 0,
    pitchDeg: 0,
    rollDeg: 2,
    phoneVisible: false,
    thirdPerson: false,
    mirrorCapture: false,
    rearCamera: false
  }),
  vehicleLock: Object.freeze({
    vehicleProfile: 'l494-2017-white',
    model: '2017 Range Rover Sport L494',
    steering: 'left',
    cabin: 'period-correct Ebony/Ivory luxury cabin',
    materials: Object.freeze(['Ivory perforated leather', 'dark polished wood trim', 'period-correct dashboard and steering wheel', 'panoramic roof', 'Ivory/cream headliner']),
    forbidNewerGenerationInterior: true
  }),
  finalImageAnchor: Object.freeze({
    driverWindowFrameSide: 'right-half',
    passengerAreaFrameSide: 'left-half',
    steeringWheelHintRegion: 'bottom-center-left',
    cabinMirrored: false
  }),
  realismPolicy: Object.freeze({
    physicalLightCausality: true,
    exposureCannotCreateLight: true,
    visibleFalloff: true,
    skinMicrotexture: true,
    fixedHairDensity: true,
    materialPhysics: true,
    contactPhysics: true,
    atmosphericDepth: true,
    smartphoneImperfections: true
  }),
  narrativeCues: Object.freeze({
    identity: 'When an identity reference is attached, it defines identity only: facial structure, natural asymmetry, skin tone, hairline and facial-hair pattern stay faithful, while pose, clothing, background and lighting come from the current scene.',
    capture: 'This is a genuine self-held Xiaomi 15 Ultra front-camera selfie; the phone itself stays outside the frame and the perspective remains a natural 21mm-equivalent arm-length view.',
    lhd: "The final image reads as a real left-hand-drive driver selfie: the driver-side window and roadside view are on the RIGHT, the passenger area recedes to the LEFT, and a small steering-wheel rim hint sits near the bottom-center-left.",
    light: 'Roadside LED light reaches only surfaces physically exposed to it, with visible falloff across the face, torso and cabin; processing reveals captured light without inventing fill illumination.',
    materials: 'Ivory leather shows fine perforation and seat compression, dark wood carries restrained directional reflections, glass reflects only visible sources, and clothing folds follow gravity and body contact.',
    imperfections: 'The photo keeps pores, fine facial hair, subtle shadow noise, mild edge softness, small color variation and a slightly imperfect handheld composition.'
  })
});

export function usesInsideDriverMasterProfile(state = {}) {
  return state.mode !== 'outside' && state.seat === 'driver-left';
}

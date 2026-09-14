import { getCameraOptic, getVehicle } from '../data/carSelfieCommonCatalog.js';

const deg = (value) => Number(value || 0) * Math.PI / 180;
const round = (value) => Math.round(value * 100) / 100;

function cameraPositionFromEye(state) {
  const distance = Number(state.distance || 45);
  const yaw = deg(state.yaw);
  const pitch = deg(state.pitch);
  const horizontal = distance * Math.cos(pitch);
  return Object.freeze({
    x_cm: round(horizontal * Math.sin(yaw)),
    y_cm: round(-distance * Math.sin(pitch)),
    z_cm: round(horizontal * Math.cos(yaw))
  });
}

function outsideSubjectAnchor(state) {
  const pose = state.standingPose || 'driver-door';
  const anchors = {
    'driver-door': { eye: [-95, 0, 8], shoulder_center: [-95, -22, 7], hip_center: [-95, -60, 4] },
    'lean-car': { eye: [-82, 0, 4], shoulder_center: [-78, -22, 4], hip_center: [-72, -60, 2] },
    'open-rear-door': { eye: [-98, 0, -105], shoulder_center: [-95, -22, -102], hip_center: [-92, -60, -98] },
    'look-camera': { eye: [-95, 0, 12], shoulder_center: [-95, -22, 10], hip_center: [-95, -60, 8] },
    'look-car': { eye: [-90, 0, 8], shoulder_center: [-88, -22, 8], hip_center: [-90, -60, 5] }
  };
  return anchors[pose] || anchors['driver-door'];
}

export function buildCarSelfieEngineeringSpec(state = {}) {
  const inside = state.mode !== 'outside';
  const driver = inside && state.seat === 'driver-left';
  const lens = getCameraOptic(state.cameraLens);
  const vehicle = getVehicle(state.vehicleProfile);
  const camera = cameraPositionFromEye(state);
  const outsideAnchor = outsideSubjectAnchor(state);

  return {
    version: 'car-selfie-engineering-v1',
    active_mode: inside ? 'inside' : 'outside',
    model_delivery: false,
    coordinate_system: {
      origin: inside ? 'driver_eye' : 'vehicle_driver_eye_reference',
      units: 'cm',
      axes: {
        x: 'positive toward passenger side / vehicle center',
        y: 'positive upward',
        z: 'positive forward through windshield'
      }
    },
    camera_position: {
      ...camera,
      optic: lens?.id || state.cameraLens,
      focal_length_eq_mm: Number(state.focalLength),
      aperture: Number(state.aperture),
      yaw_deg: Number(state.yaw),
      pitch_deg: Number(state.pitch),
      roll_deg: Number(state.roll),
      support: state.captureMode,
      acceptance_id: 'camera-geometry'
    },
    steering_wheel_visibility: {
      required: driver,
      frame_region: driver ? 'bottom-center-left' : 'not-required',
      visible_fraction_target: driver ? [0.06, 0.16] : [0, 0],
      evidence: driver ? 'top rim or top of instrument cluster must be partially visible' : 'no steering-wheel proof required for this mode/seat',
      acceptance_id: driver ? 'steering-wheel-hint' : inside ? 'seat-side-correct' : 'outside-no-cabin'
    },
    window_view: {
      required: inside,
      frame_region: driver ? 'right-half' : inside ? 'left-half-or-background' : 'background-around-vehicle',
      mandatory_content: inside ? ['asphalt', 'curb-or-road-edge', 'plausible-saudi-street-lighting'] : ['ground-surface', 'vehicle-environment-context'],
      no_landmarks_or_readable_brands: true,
      acceptance_id: driver ? 'driver-window-right' : inside ? 'seat-side-correct' : 'environment-grounding'
    },
    subject_seat_anchors: inside ? {
      seat: state.seat,
      eye_cm: driver ? [0, 0, 0] : [74, 0, 0],
      shoulder_center_cm: driver ? [0, -22, -5] : [74, -22, -5],
      hip_center_cm: driver ? [0, -58, -18] : [74, -58, -18],
      passenger_area_frame_side: driver ? 'left' : 'right',
      acceptance_id: 'seat-anchor'
    } : {
      seat: 'not-applicable',
      standing_pose: state.standingPose,
      eye_cm: outsideAnchor.eye,
      shoulder_center_cm: outsideAnchor.shoulder_center,
      hip_center_cm: outsideAnchor.hip_center,
      acceptance_id: 'subject-grounding'
    },
    vehicle_reference: {
      id: vehicle?.id || state.vehicleProfile,
      steering_side: vehicle?.steering || 'left',
      state: state.vehicleState,
      acceptance_id: inside ? 'cabin-not-mirrored' : 'vehicle-stationary'
    }
  };
}

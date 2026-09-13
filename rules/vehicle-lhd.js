(function(M){
  const FINAL_FRAME_ORDER = Object.freeze([
    'driver-side door/window and, only if naturally visible, the driver-side mirror at the LEFT edge of the final image',
    'subject seated on the physical front-left driver axis',
    'a small unmistakable steering-rim segment in the LOWER-LEFT quadrant, physically ahead of the driver torso',
    'instrument cluster immediately behind/above the steering axis when visible',
    'center stack and center console progressing from image center toward image RIGHT',
    'empty front passenger seat on image RIGHT',
    'passenger-side door/window at the far RIGHT when the crop reaches it'
  ]);

  const NEGATIVE_LHD = Object.freeze([
    'NO steering wheel on the right side of the cabin or right side of the final image',
    'NO right-hand-drive layout, UK/Japan/Australia cabin topology or passenger-side steering column',
    'NO horizontal mirroring, flipping, reversed cabin, mirrored selfie preview logic or post-capture image reversal',
    'NO subject seated in the front-right passenger seat while being described as the driver',
    'NO duplicated steering wheel, duplicate center console, center-mounted steering wheel or symmetric fantasy dashboard',
    'NO steering column crossing the center console toward the passenger seat',
    'NO passenger seat placed on image LEFT for this canonical driver-selfie layout'
  ]);

  function driverSelfie(level='detailed'){
    const core = [
      'CANONICAL SAUDI LHD DRIVER SELFIE — FINAL IMAGE COORDINATES ARE AUTHORITATIVE.',
      'The vehicle is a Saudi-market LEFT-HAND-DRIVE 2017 Range Rover Sport L494.',
      'The subject is physically seated in the FRONT-LEFT DRIVER SEAT, never the front-right passenger seat.',
      'The selfie camera is held by the driver in his LEFT hand at normal arm reach; the phone, hand, wrist, forearm and elbow stay outside the crop.',
      'Treat LEFT and RIGHT below as positions in the FINAL GENERATED IMAGE, not a mirrored phone preview and not a viewer-dependent guess.',
      'Mandatory left-to-right spatial order: ' + FINAL_FRAME_ORDER.join(' -> ') + '.',
      'The steering wheel is not optional: show a small but unmistakable rim segment in the LOWER-LEFT part of the frame. Keep the hub and most spokes cropped so it proves LHD occupancy without dominating the selfie.',
      'Dashboard logic must remain period-correct and asymmetric: driver instrument cluster on the driver/left axis; central infotainment and center controls to its right; glovebox/passenger dashboard further right in front of the empty passenger seat.',
      'Driver-side mirror, if visible, must be attached to the driver door/window geometry on the LEFT side. Never duplicate or relocate mirrors.'
    ];

    if(level==='short') return core.slice(0,7).join(' ');
    if(level==='medium') return [...core.slice(0,8), 'Reject any image that violates the required final-frame left/right order.'].join(' ');
    return [
      ...core,
      'FORCED-PERSPECTIVE LOCK: camera origin remains within the driver space, slightly left of the driver face; it must not migrate across the center console into passenger space.',
      'OCCUPANCY CHAIN: driver pelvis -> front-left driver cushion -> steering column ahead/left -> pedals below; driver left side -> driver door/window; driver right side -> center console -> empty passenger seat on image RIGHT.',
      'FINAL FRAME QA: before accepting the image, visually trace LEFT EDGE -> driver door/window -> driver + lower-left steering cue -> center console -> empty passenger seat RIGHT -> passenger door/window. Any reversal means regenerate from scratch.',
      'STRICT NEGATIVES: ' + NEGATIVE_LHD.join('; ') + '.'
    ].join(' ');
  }

  M.LHDSpatialAnchorSystem = Object.freeze({
    finalFrameOrder: FINAL_FRAME_ORDER,
    negatives: NEGATIVE_LHD,
    driverSelfie
  });

  M.register({
    id:'driver-seat-lhd',
    priority:M.levels.CRITICAL,
    when:s=>s.capture==='interior'&&s.seat==='driver',
    enforce:[
      'Saudi LHD physical front-left driver seat',
      'Final-image coordinates are authoritative; do not use mirrored-preview logic',
      'Driver holds the selfie camera in his LEFT hand; phone and arm remain outside crop',
      'Small unmistakable steering-rim segment in LOWER-LEFT final-image quadrant',
      'Center console progresses toward final-image RIGHT',
      'Empty front passenger seat remains on final-image RIGHT',
      'Instrument cluster stays on the driver steering axis',
      'Driver-side door/window and optional driver-side mirror remain on final-image LEFT'
    ],
    avoid:NEGATIVE_LHD,
    anchors:['final-image-left-edge','driver-door-window','driver-seat-axis','lower-left-steering-rim','instrument-cluster','center-console','empty-passenger-seat-right','passenger-door-right'],
    reason:'interior + driver + Saudi LHD requires explicit final-frame spatial anchors'
  });

  M.register({
    id:'interior-visible-only',
    priority:M.levels.PHYSICAL,
    when:s=>s.capture==='interior',
    enforce:['Describe only cabin components and exterior context that can enter the selected selfie frame'],
    avoid:['full exterior-car specification','hidden cabin equipment','open-door exterior pose rules'],
    reason:'camera is inside the vehicle'
  });

  M.register({
    id:'exterior-visible-only',
    priority:M.levels.PHYSICAL,
    when:s=>s.capture==='exterior',
    enforce:['Describe only visible exterior bodywork, ground contact and physically exposed cabin slivers'],
    avoid:['full dashboard specification','pedals','hidden interior controls'],
    reason:'camera is outside the vehicle'
  });
})(window.MasterRules);

export const PRESETS = Object.freeze([
  {
    id: 'street-night-selfie', label: 'سيلفي ليلي في شارع عادي',
    values: { captureType:'front-selfie', time:'night', location:'commercial-street', people:'1', ratio:'9:16', age:35, pose:'natural-standing', expression:'neutral', clothing:'navy-shirt', framing:'chest-up', focalLength:24, distance:50, yaw:0, pitch:0, roll:2, lightSource:'street-lights', lightDirection:'top-side', lightFalloff:'mixed-local' }
  },
  {
    id: 'majlis-evening', label: 'مجلس عربي مساءً',
    values: { captureType:'front-selfie', time:'evening', location:'modern-majlis', people:'1', ratio:'9:16', age:35, pose:'natural-seated', expression:'neutral', clothing:'white-thobe', framing:'chest-up', focalLength:24, distance:55, yaw:0, pitch:-2, roll:1, lightSource:'room-ceiling', lightDirection:'top-side', lightFalloff:'broad' }
  },
  {
    id: 'outdoor-candid-day', label: 'لقطة عفوية نهارية',
    values: { captureType:'candid', time:'afternoon', location:'villa-neighborhood', people:'1', ratio:'4:5', age:35, pose:'walking', expression:'small-smile', clothing:'white-tshirt', framing:'half-body', focalLength:35, distance:220, yaw:12, pitch:0, roll:1, lightSource:'open-sky-daylight', lightDirection:'side', lightFalloff:'broad' }
  },
  {
    id: 'bedroom-night-portrait', label: 'بورتريه داخلي ليلي',
    values: { captureType:'third-person', time:'night', location:'bedroom', people:'1', ratio:'4:5', age:35, pose:'natural-seated', expression:'thoughtful', clothing:'sweatshirt', framing:'head-upper-torso', focalLength:50, distance:180, yaw:8, pitch:-2, roll:0, lightSource:'warm-lamp', lightDirection:'side', lightFalloff:'local-fast' }
  }
]);

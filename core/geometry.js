const FF_DIAGONAL_MM=43.266615305567875;
export function parseRatio(ratio='9:16'){const [w,h]=String(ratio).split(':').map(Number);if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return{width:9,height:16};return{width:w,height:h};}
export function equivalentFrameDimensions(ratio){const {width,height}=parseRatio(ratio),scale=FF_DIAGONAL_MM/Math.hypot(width,height);return{widthMm:width*scale,heightMm:height*scale};}
export function sceneCoverageCm({distanceCm,focalLengthMm,ratio}){const distance=Number(distanceCm),focal=Number(focalLengthMm);if(!(distance>0)||!(focal>0))return{widthCm:NaN,heightCm:NaN};const frame=equivalentFrameDimensions(ratio);return{widthCm:distance*frame.widthMm/focal,heightCm:distance*frame.heightMm/focal};}
export function withinRange(value,[min,max],tolerance=0){return value>=min-tolerance&&value<=max+tolerance;}

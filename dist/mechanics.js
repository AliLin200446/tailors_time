// Clock-independent mechanics, shared by the renderer and numerical checks.
export const TAU=Math.PI*2;
const smooth=t=>t*t*(3-2*t);
export function tickProgress(ms){if(ms<=0)return 0;if(ms<32)return smooth(ms/32);if(ms<50)return 1+.045*smooth((ms-32)/18);if(ms<80)return 1.045-.045*smooth((ms-50)/30);return 1}
export function tickAngle(epochSecond,elapsed){return -(epochSecond%60)*TAU/60+(1-tickProgress(elapsed))*TAU/60}
export function stitchAddress(epochSecond){return{minute:Math.floor((epochSecond-1)/60),index:((epochSecond-1)%60+60)%60+1}}

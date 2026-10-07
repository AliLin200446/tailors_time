import * as THREE from './vendor/three.module.js';
const TAU=Math.PI*2;
const smooth=t=>t*t*(3-2*t);
const turn=t=>t<.32?Math.PI*smooth(t/.32):t>.68?Math.PI*smooth((1-t)/.32):Math.PI;
// Pin locations are exact 30-degree rays. Equal 3D lengths between pins keep
// every fifth arc-length division at its hour anchor, despite asymmetric bows.
export function createTapeModel(surface){
 const radius=2.12,width=.13,resolution=320;
 const configs=[{sign:1,lift:.016},{sign:-1,lift:.029,flip:true},{sign:1,lift:.015},{sign:1,lift:.055,bridge:true},{sign:1,lift:.018},{sign:1,lift:.020},{sign:1,lift:.026,accordion:true},{sign:-1,lift:.014},{sign:1,lift:.023,flip:true},{sign:1,lift:.019},{sign:1,lift:.017,kink:true},{sign:-1,lift:.018}];
 function raw(span,t,amplitude){const c=configs[span],a=(span+t)*TAU/12,envelope=Math.sin(Math.PI*t)**2;const crease=c.accordion?.009*Math.sin(t*6*Math.PI)*envelope:0;const r=radius+c.sign*amplitude*envelope+crease;const x=Math.sin(a)*r,y=Math.cos(a)*r,twist=c.flip?turn(t):c.accordion?.38*Math.sin(t*4*Math.PI)*envelope:c.kink?.3*Math.sin(t*2*Math.PI)*envelope:0;const lift=c.lift*envelope+width*.53*Math.abs(Math.sin(twist));const z=surface(x,y)+.009+lift;return{point:new THREE.Vector3(x,y,z),twist}}
 function table(span,amplitude){const points=[],lengths=[0];let length=0;for(let j=0;j<=resolution;j++){const p=raw(span,j/resolution,amplitude).point;if(j)length+=p.distanceTo(points[j-1]);points.push(p);if(j)lengths.push(length)}return{points,lengths,length,amplitude}}
 const base=configs.map((c,i)=>table(i,0)),target=Math.max(...base.map(t=>t.length))+.002;
 const spans=configs.map((c,i)=>{let lo=0,hi=.4;for(let k=0;k<38;k++){const mid=(lo+hi)/2;if(table(i,mid).length<target)lo=mid;else hi=mid}return table(i,(lo+hi)/2)});
 function center(u){const wrapped=((u%1)+1)%1,s=wrapped*12,i=Math.min(11,Math.floor(s)),f=s-i,tab=spans[i],distance=f*tab.length;let lo=0,hi=resolution;while(lo+1<hi){const mid=(lo+hi)>>1;if(tab.lengths[mid]<distance)lo=mid;else hi=mid}const q=(distance-tab.lengths[lo])/(tab.lengths[hi]-tab.lengths[lo]||1),t=(lo+q)/resolution;return raw(i,t,tab.amplitude)}
 function frame(u){const c=center(u),tangent=center(u+.00002).point.sub(center(u-.00002).point).normalize();const side=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();side.applyAxisAngle(tangent,c.twist);const normal=tangent.clone().cross(side).normalize();return{...c,tangent,side,normal}}
 function point(u,v){const f=frame(u);return f.point.clone().addScaledVector(f.side,(v-.5)*width*(1+.025*Math.sin(u*TAU*19)))}
 return{center,frame,point,width,length:target*12,spanLengths:spans.map(s=>s.length),amplitudes:spans.map(s=>s.amplitude)};
}

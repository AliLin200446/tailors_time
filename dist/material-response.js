import * as THREE from './vendor/three.module.js';
export function springResponse(state,target,dt){let left=Math.min(dt,.04);while(left>0){const h=Math.min(left,.008);state.velocity+=(240*(target-state.value)-25*state.velocity)*h;state.value+=state.velocity*h;left-=h}if(target===0&&Math.abs(state.value)<.00001&&Math.abs(state.velocity)<.0001){state.value=0;state.velocity=0}return state.value}
export function pinFlexibility(angle){return Math.sin(angle*6)**2}
const fieldGLSL=`
uniform vec4 brushPoints[8];
uniform vec2 brushDirections[8];
vec3 brushed(vec2 p){vec3 result=vec3(0.0);for(int i=0;i<8;i++){vec2 d=p-brushPoints[i].xy,dir=brushDirections[i];float along=dot(d,dir),across=dot(d,vec2(-dir.y,dir.x));float radius=brushPoints[i].w;float w=brushPoints[i].z*exp(-(along*along*.6+across*across)/(radius*radius));result+=vec3(w,dir*w);}return vec3(min(result.x,1.0),result.yz);}
`;
const tapeGLSL=`
uniform vec4 tapeTouches[3];
float clothLift(vec2 p){float lift=0.0;for(int i=0;i<3;i++){vec2 d=p-tapeTouches[i].xy;lift+=tapeTouches[i].z*exp(-dot(d,d)/.0256);}float constraint=sin(atan(p.x,p.y)*6.0);return clamp(lift,-.001,.008)*constraint*constraint;}
`;
function inject(material,key,uniforms,vertex,fragment){material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);if(vertex)shader.vertexShader=vertex(shader.vertexShader);if(fragment)shader.fragmentShader=fragment(shader.fragmentShader)};material.customProgramCacheKey=()=>`tailor-material-response-${key}`;material.needsUpdate=true}
export function addMaterialResponse({host,camera,assembly,R,feltMaterial,fiberMaterial,tapeGeometries,steelMaterial,scissors,tapeModel,materialDetails}){
 const fields=Array.from({length:8},()=>new THREE.Vector4(0,0,0,.24)),directions=Array.from({length:8},()=>new THREE.Vector2(1,0)),stamps=new Float64Array(8).fill(-Infinity),baseStrength=new Float32Array(8);
 const tapeTouches=Array.from({length:3},()=>new THREE.Vector4()),tapeStates=Array.from({length:3},()=>({value:0,velocity:0,span:-1,last:-Infinity}));const steel={value:0,velocity:0};
 const uniforms={brushPoints:{value:fields},brushDirections:{value:directions},tapeTouches:{value:tapeTouches},steelTouch:{value:0}};
 const localVertex=s=>s.replace('#include <common>','#include <common>\nvarying vec2 localMaterialPoint;\n'+fieldGLSL).replace('#include <begin_vertex>','#include <begin_vertex>\nlocalMaterialPoint=position.xy; vec3 fiberBrush=brushed(position.xy); transformed.z-=fiberBrush.x*.00065;');
 inject(feltMaterial,'felt',uniforms,localVertex,s=>s.replace('#include <common>','#include <common>\nvarying vec2 localMaterialPoint;\n'+fieldGLSL).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.0-brushed(localMaterialPoint).x*.007;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=min(1.0,roughnessFactor-brushed(localMaterialPoint).x*.014);').replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(normal+vec3(brushed(localMaterialPoint).yz*.006,0.0));'));
 inject(fiberMaterial,'fibers',uniforms,s=>s.replace('#include <common>','#include <common>\n'+fieldGLSL).replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 fiberBrush=brushed(position.xy);transformed.xy+=fiberBrush.yz*.0035;transformed.z-=fiberBrush.x*.0008;'));
 const tapeVertex=s=>s.replace('#include <common>','#include <common>\n'+tapeGLSL).replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=clothLift(position.xy);');
 const tapeSet=new Set(tapeGeometries),seenMaterials=new Set();assembly.traverse(o=>{if(!tapeSet.has(o.geometry))return;if(!seenMaterials.has(o.material)){inject(o.material,'cloth-'+o.material.type+'-'+o.material.side,uniforms,tapeVertex);seenMaterials.add(o.material)}if(o.isMesh){const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:o.material.side});inject(depth,'cloth-depth-'+o.material.side,uniforms,tapeVertex);o.customDepthMaterial=depth}});
 inject(steelMaterial,'steel',uniforms,null,s=>s.replace('#include <common>','#include <common>\nuniform float steelTouch;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=max(.05,roughnessFactor-steelTouch*.027);'));
 inject(materialDetails.chalkMaterial,'chalk',uniforms,s=>s.replace('#include <common>','#include <common>\nvarying vec2 localMaterialPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nlocalMaterialPoint=position.xy;'),s=>s.replace('#include <common>','#include <common>\nvarying vec2 localMaterialPoint;\n'+fieldGLSL+'\nfloat chalkContact(vec2 p){float w=0.0;for(int i=0;i<8;i++){vec2 d=p-brushPoints[i].xy;w+=brushPoints[i].z*exp(-dot(d,d)/.0025);}return min(w,1.0); }').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=1.0-.045*chalkContact(localMaterialPoint);'));
 const media=matchMedia('(prefers-reduced-motion: reduce)'),raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2(),inverse=new THREE.Matrix4(),ray=new THREE.Ray(),sphere=new THREE.Sphere(new THREE.Vector3(),R),hit=new THREE.Vector3();
 const tapeSamples=Array.from({length:192},(_,i)=>tapeModel.center(i/192).point);
 let pending=false,present=false,previous=null,previousTime=0,moveTime=-Infinity,slot=0,steelTarget=0,lastPoint=null,lastDirection=new THREE.Vector2(1,0);
 function capture(e){if(media.matches)return;const r=host.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);pending=true;present=true}
 function leave(){present=false;pending=false;previous=null;steelTarget=0}
 host.addEventListener('pointermove',capture,{passive:true});host.addEventListener('pointerdown',capture,{passive:true});host.addEventListener('pointerleave',leave,{passive:true});host.addEventListener('pointerup',e=>{if(e.pointerType==='touch')leave()},{passive:true});host.addEventListener('pointercancel',leave,{passive:true});window.addEventListener('blur',leave);media.addEventListener('change',leave);
 function update(dt,now,enabled){
  if(media.matches||!enabled){stamps.fill(-Infinity);baseStrength.fill(0);moveTime=-Infinity;lastPoint=null;steelTarget=0;for(const f of fields)f.z=0;for(let i=0;i<3;i++){tapeTouches[i].z=0;tapeStates[i].value=tapeStates[i].velocity=0;tapeStates[i].last=-Infinity}uniforms.steelTouch.value=0;steel.value=steel.velocity=0;materialDetails.setInteraction(null,lastDirection,0,true);previous=null;pending=false;return}
  if(pending&&present){pending=false;assembly.updateMatrixWorld(true);raycaster.setFromCamera(ndc,camera);inverse.copy(assembly.matrixWorld).invert();ray.copy(raycaster.ray).applyMatrix4(inverse);ray.origin.z/=.082;ray.direction.z/=.082;ray.direction.normalize();const intersects=ray.intersectSphere(sphere,hit);if(intersects){hit.z*=.082;const point=new THREE.Vector2(hit.x,hit.y);if(previous){const distance=point.distanceTo(previous),seconds=Math.max(.008,(now-previousTime)/1000);if(distance>.0008){const velocity=Math.min(12,distance/seconds),direction=point.clone().sub(previous).normalize();lastDirection.copy(direction);lastPoint=point;moveTime=now;fields[slot].set(point.x,point.y,0,.22+velocity*.009);directions[slot].copy(direction);stamps[slot]=now;baseStrength[slot]=.40/(1+velocity*.14);slot=(slot+1)%8;
    let nearest=0,best=Infinity;for(let i=0;i<tapeSamples.length;i++){const d=(tapeSamples[i].x-point.x)**2+(tapeSamples[i].y-point.y)**2;if(d<best){best=d;nearest=i}}if(best<.15**2){const span=Math.floor(nearest/16);let index=tapeStates.findIndex(s=>s.span===span);if(index<0)index=tapeStates.reduce((chosen,s,i)=>s.last<tapeStates[chosen].last?i:chosen,0);const state=tapeStates[index];state.span=span;state.last=now;tapeTouches[index].x=point.x;tapeTouches[index].y=point.y}
    steelTarget=raycaster.intersectObjects(scissors,true).length?1:0;
   }}previous=point;previousTime=now;}else{previous=null;steelTarget=0}}
  for(let i=0;i<8;i++){const age=(now-stamps[i])/650;fields[i].z=age>=1?0:baseStrength[i]*(1-age)**2}
  for(let i=0;i<3;i++){const state=tapeStates[i],target=now-state.last<85?.007:0;const value=springResponse(state,target,dt);if(now-state.last>850)state.value=state.velocity=0;tapeTouches[i].z=state.value}
  uniforms.steelTouch.value=springResponse(steel,now-moveTime<85?steelTarget:0,dt);if(now-moveTime>850)uniforms.steelTouch.value=steel.value=steel.velocity=0;
  materialDetails.setInteraction(lastPoint,lastDirection,now-moveTime<100?1:0,false);
 }
 return{update};
}

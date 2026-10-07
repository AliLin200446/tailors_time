import * as THREE from './vendor/three.module.js';
export const THREAD_COLOR=0xdec39a;

// The eye is a hard constraint; only the loose thread responds to the impulse.
export function advanceThread(state,target,dt){
 let remaining=Math.min(dt,.04);
 while(remaining>0){const step=Math.min(remaining,.008),delta=Math.atan2(Math.sin(target-state.angle),Math.cos(target-state.angle));state.velocity+=(delta*640-state.velocity*43)*step;state.angle+=state.velocity*step;remaining-=step}
 return state;
}
export function addMaterialDetails(assembly,surface,R,initialAngle){
 const motion={angle:initialAngle,velocity:0};
 const controls=Array.from({length:7},()=>new THREE.Vector3());
 const curve=new THREE.CatmullRomCurve3(controls,false,'centripetal');
 const lengths=[.065,.095,.24,.55,1.0,1.43,1.68],offsets=[.018,0,-.045,-.09,-.075,-.045,.018];
 const segments=56,sides=7,positions=new Float32Array((segments+1)*(sides+1)*3),indices=[];
 for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setIndex(indices);
 const material=new THREE.MeshBasicMaterial({color:THREAD_COLOR,transparent:true,opacity:.96,depthTest:false,depthWrite:false});
 const thread=new THREE.Mesh(geometry,material);thread.renderOrder=23;thread.frustumCulled=false;assembly.add(thread);
 function update(needleAngle,dt){advanceThread(motion,needleAngle,dt);const lag=Math.atan2(Math.sin(motion.angle-needleAngle),Math.cos(motion.angle-needleAngle));
  for(let i=0;i<controls.length;i++){const softness=Math.max(0,(i-1)/(controls.length-2)),a=needleAngle+lag*softness,x=offsets[i],y=lengths[i];controls[i].set(x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),i===1?.715:.742+Math.sin(softness*Math.PI)*.012)}
  const p=new THREE.Vector3(),tangent=new THREE.Vector3();for(let i=0;i<=segments;i++){const u=i/segments;curve.getPoint(u,p);curve.getTangent(u,tangent);const nx=-tangent.y,ny=tangent.x,norm=Math.hypot(nx,ny)||1,radius=.0085*(1-.68*Math.pow(u,7));for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,k=(i*(sides+1)+j)*3;positions[k]=p.x+nx/norm*Math.cos(a)*radius;positions[k+1]=p.y+ny/norm*Math.cos(a)*radius;positions[k+2]=p.z+Math.sin(a)*radius}}
  geometry.attributes.position.needsUpdate=true;
 }
 update(initialAngle,0);
 // Four sparse, static chalk gestures. A separate seeded generator prevents
 // material additions from changing any existing felt/tape/pin randomization.
 let seed=403;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;const ctx=canvas.getContext('2d'),scale=2048/(R*2);
 const marks=[
  {points:[[-.58,-1.31],[-.39,-1.40],[-.17,-1.43],[.04,-1.40],[.22,-1.33]],width:.011},
  {points:[[.49,-1.65],[.53,-1.55],[.59,-1.63]],width:.013},
  {points:[[-.98,-1.08],[-.84,-.96],[-.72,-.85]],width:.009,dashed:true},
  {points:[[-1.41,-.63],[-1.30,-.63],[-1.355,-.63],[-1.355,-.58],[-1.355,-.68]],width:.009}
 ];
 for(const mark of marks){const path=new THREE.CatmullRomCurve3(mark.points.map(([x,y])=>new THREE.Vector3(x,y,0)),false,'centripetal'),samples=Math.ceil(path.getLength()*620);
  for(let i=0;i<samples;i++){if(mark.dashed&&Math.floor(i/18)%2)continue;if(random()<.16)continue;const p=path.getPoint(i/Math.max(1,samples-1));for(let n=0;n<7;n++){const x=p.x+(random()-.5)*mark.width*2,y=p.y+(random()-.5)*mark.width*2,alpha=.035+random()*.14;ctx.fillStyle=`rgba(225,200,179,${alpha})`;ctx.beginPath();ctx.ellipse((x+R)*scale,(R-y)*scale,.28+random()*.8,.3+random()*.65,random()*Math.PI,0,Math.PI*2);ctx.fill()}if(random()<.11){ctx.fillStyle='rgba(225,200,179,.07)';ctx.fillRect((p.x+R+(random()-.5)*.05)*scale,(R-p.y+(random()-.5)*.05)*scale,.7,.7)}}
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const chalkGeometry=new THREE.PlaneGeometry(R*2,R*2,96,96),pos=chalkGeometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,surface(pos.getX(i),pos.getY(i))+.0045);chalkGeometry.computeVertexNormals();
 const chalk=new THREE.Mesh(chalkGeometry,new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.78,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));chalk.renderOrder=1;assembly.add(chalk);
 return{update};
}

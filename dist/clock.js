import {addThreadStart} from './start-thread.js';
import {addAtelierDesk} from './atelier-desk.js';
import {createAudioStart} from './audio-start.js';
import * as THREE from './vendor/three.module.js';
import {createTapeModel} from './tape-system.js';
import {tickAngle,stitchAddress} from './mechanics.js';
import {addMaterialDetails,THREAD_COLOR} from './material-details.js';
import {addTemporalBehavior} from './temporal-behavior.js';
import {addMaterialResponse} from './material-response.js';
const host=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
const scene=new THREE.Scene(),assembly=new THREE.Group();scene.add(assembly);
const camera=new THREE.OrthographicCamera(-4,4,3,-3,.1,40);camera.position.z=12;
scene.add(new THREE.AmbientLight(0xfff4de,2.55));
const light=new THREE.DirectionalLight(0xfff8e8,1.05);light.position.set(-3,5,10);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-4,right:4,top:4,bottom:-4});light.shadow.normalBias=.015;light.shadow.bias=-.0003;light.shadow.radius=3;scene.add(light);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.065}));ground.position.z=-.3;ground.receiveShadow=true;scene.add(ground);
let seed=1729;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const tau=Math.PI*2,R=2.68;const surface=(x,y)=>.22*Math.sqrt(Math.max(0,1-(x*x+y*y)/(R*R)));
function mesh(g,m,parent=assembly){const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function rod(a,b,r,m,parent=assembly){const d=b.clone().sub(a),o=mesh(new THREE.CylinderGeometry(r,r,d.length(),8),m,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
const inkTexture=canvasTexture(1024,1024,(c,w,h)=>{c.fillStyle='#c83d25';c.fillRect(0,0,w,h);for(let i=0;i<48000;i++){c.fillStyle=rand()<.5?'rgba(73,22,10,.06)':'rgba(255,184,99,.09)';c.fillRect(rand()*w,rand()*h,.4+rand()*1.8,.5+rand()*1.8)}});
const feltMaterial=new THREE.MeshStandardMaterial({map:inkTexture,roughness:1,metalness:0,color:0xf3dfca});
const feltGeometry=new THREE.SphereGeometry(R,160,80),fp=feltGeometry.attributes.position;
for(let i=0;i<fp.count;i++){const x=fp.getX(i),y=fp.getY(i),a=Math.atan2(y,x),ripple=1+.0015*Math.sin(a*19)+.001*Math.sin(a*31);fp.setXYZ(i,x*ripple,y*ripple,fp.getZ(i)*.082)}feltGeometry.computeVertexNormals();mesh(feltGeometry,feltMaterial);
const fibers=[];for(let i=0;i<9500;i++){const a=rand()*tau,r=R*Math.sqrt(rand()),x=Math.sin(a)*r,y=Math.cos(a)*r,z=surface(x,y)+.003,b=rand()*tau,l=.003+rand()*.012;fibers.push(x,y,z,x+Math.sin(b)*l,y+Math.cos(b)*l,z+.001)}const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fibers,3));const fiberMaterial=new THREE.LineBasicMaterial({color:0xec7750,transparent:true,opacity:.13});assembly.add(new THREE.LineSegments(fg,fiberMaterial));
// Flexible, double-sided cloth; all 60 marks are measured along its centerline.
const tapeModel=createTapeModel(surface),tapePoint=tapeModel.point;
function clothTexture(back){return canvasTexture(4096,128,(c,w,h)=>{c.fillStyle=back?'#a74931':'#d2c5a5';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=3){c.fillStyle=x%6?'rgba(45,30,18,.08)':'rgba(255,222,182,.13)';c.fillRect(x,0,1,h)}for(let y=0;y<h;y+=3){c.fillStyle='rgba(65,40,23,.065)';c.fillRect(0,y,w,1)}for(let i=0;i<60;i++){c.fillStyle=back?'#e4ba88':i%15===0?'#37382d':'#554c3d';c.fillRect(i*w/60,6,i%15===0?5:i%5===0?3.5:2,i%15===0?91:i%5===0?73:i%2?32:45)}for(let i=0;i<18000;i++){c.fillStyle=back?'rgba(144,63,39,.18)':'rgba(198,166,125,.20)';c.fillRect(rand()*w,rand()*h,1+rand()*3,1)}})}
const frontTexture=clothTexture(false),backTexture=clothTexture(true);frontTexture.wrapS=backTexture.wrapS=THREE.RepeatWrapping;
const frontMaterial=new THREE.MeshStandardMaterial({map:frontTexture,roughness:1,metalness:0,side:THREE.FrontSide,color:0xe6d8bb});
const backMaterial=new THREE.MeshStandardMaterial({map:backTexture,roughness:1,metalness:0,side:THREE.BackSide,color:0xf0c9ae});
const vertices=[],uv=[],indices=[];const N=1440,C=6;
for(let i=0;i<=N;i++)for(let j=0;j<=C;j++){const p=tapePoint(i/N,j/C);vertices.push(p.x,p.y,p.z);uv.push(i/N,j/C);if(i<N&&j<C){const k=i*(C+1)+j;indices.push(k,k+C+1,k+1,k+1,k+C+1,k+C+2)}}
const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));tg.setIndex(indices);tg.computeVertexNormals();
const tapeGeometries=[tg];
const tape=mesh(tg,frontMaterial);mesh(tg,backMaterial);tape.name='60 arc-length divisions, 12 equal-length constrained cloth spans';
// Both thin selvage edges follow the ribbon frame through every real half-turn.
for(const v of [0,1]){const positions=[],idx=[];for(let i=0;i<=N;i++){const f=tapeModel.frame(i/N),p=tapePoint(i/N,v);positions.push(p.x,p.y,p.z,p.x-f.normal.x*.002,p.y-f.normal.y*.002,p.z-f.normal.z*.002);if(i<N){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(idx);g.computeVertexNormals();tapeGeometries.push(g);mesh(g,new THREE.MeshStandardMaterial({color:0xb99b78,roughness:1,side:THREE.DoubleSide}))}
const fray=[];for(let i=0;i<1300;i++){const u=rand(),f=tapeModel.frame(u),p=tapePoint(u,rand()<.5?0:1),q=p.clone().addScaledVector(f.side,(rand()-.5)*.012).addScaledVector(f.normal,.002);fray.push(p.x,p.y,p.z,q.x,q.y,q.z)}const frayG=new THREE.BufferGeometry();frayG.setAttribute('position',new THREE.Float32BufferAttribute(fray,3));assembly.add(new THREE.LineSegments(frayG,new THREE.LineBasicMaterial({color:0xd3b28b,transparent:true,opacity:.32})));
tapeGeometries.push(frayG);
const dark=new THREE.MeshStandardMaterial({color:0x171916,roughness:.92,metalness:0});const needleMat=new THREE.MeshStandardMaterial({color:0x797562,roughness:.65,metalness:.15});
const pinColors=[0x24241d,0xb92717,0xcfc3a0,0x23261e,0x4b5541,0x932b19,0xc9ba95,0x22241e,0xa88b42,0xc8b994,0x9e2e1a,0x22241e];
const pins=[];
for(let i=0;i<12;i++){const group=new THREE.Group();assembly.add(group);const u=i/12,a=u*tau,p=tapePoint(u,.50),lean=new THREE.Vector3(Math.sin(a)*(.065+rand()*.035),Math.cos(a)*(.065+rand()*.035),.13+rand()*.07); // Keep both the entry point and head on their exact hour ray.
lean.x=Math.sin(a)*.09;lean.y=Math.cos(a)*.09;const head=p.clone().add(lean),tip=p.clone().addScaledVector(lean,-.32);rod(tip,head,.0065,needleMat,group);const ball=mesh(new THREE.SphereGeometry(.035+rand()*.005,16,12),new THREE.MeshBasicMaterial({color:pinColors[i]}),group);ball.position.copy(head);const hole=mesh(new THREE.CircleGeometry(.014,14),new THREE.MeshBasicMaterial({color:0x573723,transparent:true,opacity:.45,depthWrite:false}));hole.position.copy(p);hole.position.z+=.002;pins.push({group,hole});}
// Two exaggerated halves still share one stationary mechanical pivot.
function bladeShape(length,width){const s=new THREE.Shape();s.moveTo(-.075,-.18);s.lineTo(-width,.35);s.lineTo(0,length);s.quadraticCurveTo(.11,length*.5,.13,.24);s.lineTo(.09,-.18);s.closePath();return s}
function stemShape(side){const s=new THREE.Shape(),x=side*.15;s.moveTo(-.075,-.08);s.bezierCurveTo(-.09,-.39,x-.075,-.59,x-.075,-.84);s.lineTo(x+.075,-.84);s.bezierCurveTo(x+.075,-.59,.10,-.36,.09,-.08);s.closePath();return s}
function loopShape(side,large){const s=new THREE.Shape(),x=side*.30,y=large?-1.40:-1.16,rx=large?.49:.34,ry=large?.69:.46;s.absellipse(x,y,rx,ry,0,tau,false,side*.3);const h=new THREE.Path();h.absellipse(x,y,rx-.115,ry-.14,0,tau,true,side*.3);s.holes.push(h);return s}
function hand(length,width,side,large,z){const group=new THREE.Group();assembly.add(group);group.position.z=z;const shapes=[bladeShape(length,width),stemShape(side),loopShape(side,large)];for(const s of shapes)mesh(new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:1,curveSegments:48}),dark,group);return{group,shapes,angle:0,velocity:0}}
const minute=hand(2.055,.18,1,true,.47),hour=hand(1.72,.235,-1,false,.53);
const rivet=mesh(new THREE.CylinderGeometry(.078,.078,.04,40),new THREE.MeshStandardMaterial({color:0x8a7352,roughness:.8,metalness:.15}));rivet.rotation.x=Math.PI/2;rivet.position.z=.60;const slit=mesh(new THREE.BoxGeometry(.071,.008,.002),dark);slit.position.z=.622;slit.rotation.z=.4;
const stitchRadius=1.88;
const needle=new THREE.Group();assembly.add(needle);needle.position.z=.72;
// One tapered steel needle, lifted above the scissors, aligned to its recording circle.
const needleStart=new THREE.Vector3(0,.13,0),needleTip=new THREE.Vector3(0,stitchRadius,.008),shaftVector=needleTip.clone().sub(needleStart);
const shaft=mesh(new THREE.CylinderGeometry(.0006,.0055,shaftVector.length(),10),needleMat,needle);shaft.position.copy(needleStart).add(needleTip).multiplyScalar(.5);shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),shaftVector.normalize());
const eye=mesh(new THREE.TorusGeometry(.014,.0035,8,24),needleMat,needle);eye.position.set(0,.095,-.005);eye.scale.y=2.5;
// An explicit final opaque render pass guarantees clean blade/handle crossings.
const topNeedleMaterial=new THREE.MeshStandardMaterial({color:0xb5b3a4,roughness:.42,metalness:.35,transparent:true,opacity:1,depthTest:false,depthWrite:false});
needle.renderOrder=20;shaft.material=topNeedleMaterial;shaft.renderOrder=22;shaft.castShadow=false;eye.material=topNeedleMaterial;eye.renderOrder=21;eye.castShadow=false;
const contact=mesh(new THREE.CircleGeometry(.017,20),new THREE.MeshBasicMaterial({color:0x552718,transparent:true,opacity:0,depthWrite:false}));contact.castShadow=false;
// Each observed second punches two tiny holes and draws a short, raised thread.
// Two minute layers coexist only during the old layer's sinking/fading period.
const stitchLayers=new Map();let lastSecond=Math.floor(Date.now()/60000)*60;
function stitchLayer(minuteKey){if(stitchLayers.has(minuteKey))return stitchLayers.get(minuteKey);const group=new THREE.Group();assembly.add(group);const thread=new THREE.LineBasicMaterial({color:THREAD_COLOR,transparent:true,opacity:.65,depthWrite:false});const holeMat=new THREE.MeshBasicMaterial({color:0x60291c,transparent:true,opacity:.36,depthWrite:false});const layer={group,thread,holeMat,key:minuteKey};stitchLayers.set(minuteKey,layer);return layer}
function sew(second){const {minute:key,index}=stitchAddress(second),a=index*tau/60,layer=stitchLayer(key),points=[];const r=stitchRadius;for(let j=0;j<=5;j++){const b=a-(1-j/5)*.044,x=Math.sin(b)*r,y=Math.cos(b)*r;points.push(new THREE.Vector3(x,y,surface(x,y)+.006+Math.sin(j/5*Math.PI)*.006))}const g=new THREE.BufferGeometry().setFromPoints(points);layer.group.add(new THREE.Line(g,layer.thread));for(const p of [points[0],points[5]]){const hole=new THREE.Mesh(new THREE.CircleGeometry(.007,8),layer.holeMat);hole.position.copy(p);hole.position.z-=.003;layer.group.add(hole)}}
function updateStitches(seconds){const whole=Math.floor(seconds);for(let t=Math.max(lastSecond+1,whole-119);t<=whole;t++)sew(t);lastSecond=whole;const current=Math.floor(seconds/60);for(const [key,l] of stitchLayers){const age=key<current?seconds-(key+1)*60:0,fade=Math.max(0,1-age/14);l.thread.opacity=.65*fade;l.holeMat.opacity=.36*fade;l.group.position.z=-age*.002;if(fade===0){l.group.traverse(o=>o.geometry?.dispose());l.thread.dispose();l.holeMat.dispose();assembly.remove(l.group);stitchLayers.delete(key)}}}
function timeAngles(ms){const d=new Date(ms),sec=d.getSeconds()+d.getMilliseconds()/1000,m=d.getMinutes()+sec/60,h=d.getHours()%12+m/60;return[-m*tau/60,-h*tau/12,-sec*tau/60]}
const pointer=new THREE.Vector2(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
host.addEventListener('pointermove',e=>{if(!reduce)pointer.set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5)});host.addEventListener('pointerleave',()=>pointer.set(0,0));window.addEventListener('blur',()=>pointer.set(0,0));
// Fit the complete felt boundary, including its edge fibers, with 10px clearance.
feltGeometry.computeBoundingSphere();
const framingDiameter=2*(feltGeometry.boundingSphere.radius+.016);
let threadStart;
const atelierDesk=addAtelierDesk({scene,camera,host,radius:R});
function resize(){const w=host.clientWidth,h=host.clientHeight,aspect=w/h,available=Math.max(1,Math.min(w-20,h-20)),vertical=framingDiameter*h/available;renderer.setSize(w,h);camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();atelierDesk.layout();threadStart?.layout()}new ResizeObserver(resize).observe(host);resize();
// The first viewport gesture wakes one shared context before starting the mechanism.
let audioContext,noiseBuffer;
const audioStart=createAudioStart({
 createContext:()=>new (window.AudioContext||window.webkitAudioContext)(),
 prepare:context=>{audioContext=context;noiseBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.04),context.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.006));},
 onStart:()=>{prev=performance.now();threadStart.activate();playTick(.65);temporal.start();},
 onFailure:()=>{if(['localhost','127.0.0.1','[::1]'].includes(location.hostname))console.warn('Clock audio unavailable; continuing visually.');}
});
threadStart=addThreadStart({desk:atelierDesk,wake:audioStart.wake,unlock:audioStart.unlock});
for(const event of ['pointerdown','click','touchstart'])window.addEventListener(event,e=>{if(!threadStart.contains(e.target))audioStart.wake()},{passive:true,capture:true});
function playTick(volume=1){if(!audioStart.audible||document.hidden)return;const t=audioContext.currentTime,noise=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain(),metal=audioContext.createOscillator(),metalGain=audioContext.createGain();noise.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=1900;filter.Q.value=.65;gain.gain.setValueAtTime(.048*volume,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.036);noise.connect(filter).connect(gain).connect(audioContext.destination);metal.type='sine';metal.frequency.setValueAtTime(3300,t);metal.frequency.exponentialRampToValueAtTime(2200,t+.024);metalGain.gain.setValueAtTime(.008*volume,t);metalGain.gain.exponentialRampToValueAtTime(.0001,t+.027);metal.connect(metalGain).connect(audioContext.destination);noise.start(t);metal.start(t);noise.stop(t+.04);metal.stop(t+.034);noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect()};metal.onended=()=>{metal.disconnect();metalGain.disconnect()}}
function playSnip(){if(!audioStart.audible||document.hidden)return;const t=audioContext.currentTime;for(const [delay,frequency,volume]of[[0,1150,.03],[.021,2600,.017]]){const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=noiseBuffer;filter.type='highpass';filter.frequency.value=frequency;gain.gain.setValueAtTime(volume,t+delay);gain.gain.exponentialRampToValueAtTime(.0001,t+delay+.031);source.connect(filter).connect(gain).connect(audioContext.destination);source.start(t+delay);source.stop(t+delay+.038);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()}}}
const materialDetails=addMaterialDetails(assembly,surface,R,tickAngle(Math.floor(Date.now()/1000),80));
const temporal=addTemporalBehavior({tapeGeometries,pins,minute,hour,needle,materialDetails,playContact:playTick,playSnip});
const materialResponse=addMaterialResponse({host,camera,assembly,R,feltMaterial,fiberMaterial,tapeGeometries,steelMaterial:dark,scissors:[minute.group,hour.group],tapeModel,materialDetails});
let activated=false;
let prev=performance.now(),tickSecond=Math.floor(Date.now()/1000),tickStart=-Infinity;
document.addEventListener('visibilitychange',()=>{if(document.hidden){audioContext?.suspend().catch(()=>{});temporal.skipCut();}else{tickSecond=Math.floor(Date.now()/1000);tickStart=-Infinity;if(audioContext)audioStart.wake();}});
function animate(now){requestAnimationFrame(animate);if(document.hidden){prev=now;return}const dt=Math.min((now-prev)/1000,.04);prev=now;const ms=Date.now(),second=Math.floor(ms/1000),a=timeAngles(ms);
 // Freeze an unfinished intro if the browser interrupts audio.
 const running=(temporal.active||audioStart.canAdvance)?temporal.update(dt,a):false;
materialResponse.update(dt,now,running);
 if(running){if(!activated){activated=true;tickSecond=second;tickStart=-Infinity;lastSecond=Math.floor(ms/60000)*60;}
 const adjacent=second===tickSecond+1,changed=second!==tickSecond;if(changed){tickSecond=second;tickStart=adjacent?now:-Infinity;if(adjacent&&second%60!==0)playTick();}
 const elapsed=now-tickStart;needle.rotation.z=tickAngle(tickSecond,elapsed);needle.position.z=.72;materialDetails.update(needle.rotation.z,dt);updateStitches(ms/1000);
 if(changed&&adjacent&&second%60===0)temporal.cut(stitchLayers.get(Math.floor(second/60)-1));
 const angle=(tickSecond%60)*tau/60,x=Math.sin(angle)*stitchRadius,y=Math.cos(angle)*stitchRadius;contact.position.set(x,y,surface(x,y)+.004);contact.material.opacity=elapsed<130?.22*Math.sin(Math.min(1,elapsed/130)*Math.PI):0;contact.scale.setScalar(1+.3*Math.sin(Math.min(1,elapsed/130)*Math.PI));}
 assembly.rotation.y+=(pointer.x*.052-assembly.rotation.y)*Math.min(dt*3,1);assembly.rotation.x+=(-pointer.y*.052-assembly.rotation.x)*Math.min(dt*3,1);atelierDesk.update(dt,now);renderer.render(scene,camera)}requestAnimationFrame(animate);
renderer.domElement.addEventListener('webglcontextlost',e=>e.preventDefault());renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());

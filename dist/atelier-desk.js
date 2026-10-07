import * as THREE from './vendor/three.module.js';

// Desk objects belong to the scene, never to the moving clock assembly.
export function addAtelierDesk({scene,camera,host,radius}){
 const desk=new THREE.Group();desk.name='Sparse atelier remnants';scene.add(desk);
 const floor=-.3;
 const steel=new THREE.MeshStandardMaterial({color:0x98968a,roughness:.78,metalness:.28,vertexColors:true});
 const threadMaterial=new THREE.MeshStandardMaterial({color:0x932b19,roughness:1});
 const shadowMaterial=new THREE.MeshBasicMaterial({color:0x433c2c,transparent:true,opacity:.045,depthWrite:false});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const add=(geometry,material,parent)=>{const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 function contact(parent,x,y,sx,sy){const m=add(new THREE.CircleGeometry(1,32),shadowMaterial,parent);m.castShadow=false;m.position.set(x,y,floor+.001);m.scale.set(sx,sy,1);return m}
 function lineTube(points,r,material,parent){return add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal'),72,r,5,false),material,parent)}
 const loose=new THREE.Group();desk.add(loose);
 const points=[[-.65,.07,.010],[-.39,.10,.008],[-.16,.045,.006],[.06,-.018,.005],[.22,-.012,.006],[.33,.07,.009],[.31,.18,.012],[.21,.215,.014],[.16,.14,.010],[.23,.052,.006],[.44,.065,.006],[.60,.018,.005],[.68,.055,.004]];
 const thread=lineTube(points,.003,threadMaterial,loose);
 const threadBase=thread.geometry.attributes.position.array.slice();
 const threadShadow=lineTube(points.map(([x,y])=>[x+.008,y-.011,.0015]),.004,shadowMaterial,loose);threadShadow.castShadow=false;

 // The thimble shell itself carries the recessed dimples, including its closed crown.
 const thimble=new THREE.Group();desk.add(thimble);
 const metal=new THREE.Group();thimble.add(metal);metal.rotation.set(.82,-.28,-.36);
 const rows=100,cols=144,positions=[],colors=[],indices=[];
 for(let j=0;j<=rows;j++){
  const t=j/rows,z=t*.265;
  const crown=t>.76?Math.sqrt(Math.max(0,1-((t-.76)/.24)**2)):1;
  const baseRadius=(.103-.022*Math.min(1,t/.76))*crown;
  for(let i=0;i<=cols;i++){
   const a=i/cols*Math.PI*2,row=Math.round((t-.13)/.096),center=.13+row*.096;
   const rowOffset=(row%2)*.5,around=a/(Math.PI*2)*24-rowOffset;
   const da=(around-Math.round(around))/.25,dz=(t-center)/.032;
   const dent=t>.09&&t<.93?.0052*Math.exp(-2*(da*da+dz*dz)):0;
   const wear=.0005*Math.sin(a*37+t*110)*Math.sin(t*67);
   const r=Math.max(0,baseRadius-dent+wear*crown);
   positions.push(Math.cos(a)*r,Math.sin(a)*r,z);
   const patina=1-.42*dent/.0052;colors.push(patina,patina,patina);
   if(j<rows&&i<cols){const k=j*(cols+1)+i;indices.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1)}
  }
 }
 const shellGeometry=new THREE.BufferGeometry();shellGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));shellGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));shellGeometry.setIndex(indices);shellGeometry.computeVertexNormals();
 add(shellGeometry,steel,metal);
 const plainSteel=steel.clone();plainSteel.vertexColors=false;
 const lip=add(new THREE.TorusGeometry(.103,.007,8,64),plainSteel,metal);lip.position.z=.007;
 const inner=add(new THREE.CircleGeometry(.095,48),new THREE.MeshStandardMaterial({color:0x35352d,roughness:.9,side:THREE.DoubleSide}),metal);inner.position.z=.014;
 // Sparse engraved wear catches the same scene light as the clock's steel.
 const scratches=[];for(let i=0;i<18;i++){const a=i*2.399,z=.035+(i%7)*.019,r=.104-z*.083;for(const da of [0,.05+(i%3)*.025])scratches.push(Math.cos(a+da)*r,Math.sin(a+da)*r,z+da*.007)}
 const scratchGeometry=new THREE.BufferGeometry();scratchGeometry.setAttribute('position',new THREE.Float32BufferAttribute(scratches,3));metal.add(new THREE.LineSegments(scratchGeometry,new THREE.LineBasicMaterial({color:0xd2c5a5,transparent:true,opacity:.15})));
 // Ground the tilted shell's lowest point exactly on the desktop.
 metal.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(metal);metal.position.z=floor-bounds.min.z+.001;
 contact(thimble,.025,-.037,.117,.082);

 const pinSteel=plainSteel.clone();
 const pin=new THREE.Group();desk.add(pin);
 const shaft=add(new THREE.CylinderGeometry(.002,.004,.36,8),pinSteel,pin);shaft.rotation.z=.38;shaft.position.z=floor+.005;
 const head=add(new THREE.SphereGeometry(.012,12,8),new THREE.MeshStandardMaterial({color:0x24241d,roughness:.9}),pin);head.position.set(-Math.sin(.38)*.18,Math.cos(.38)*.18,floor+.012);
 const pinShadow=add(new THREE.PlaneGeometry(.008,.36),shadowMaterial,pin);pinShadow.rotation.z=.38;pinShadow.position.set(.005,-.007,floor+.001);pinShadow.castShadow=false;
 const offcut=new THREE.Group();desk.add(offcut);
 lineTube([[0,0,.005],[.035,.012,.009],[.063,.002,.005],[.093,-.017,.004]],.002,new THREE.MeshStandardMaterial({color:0xb99b78,roughness:1}),offcut);

 function outside(x,y,padding){return Math.hypot(x,y)>radius+padding}
 function layout(){
  const left=camera.left,right=camera.right,bottom=camera.bottom,top=camera.top;
  loose.position.set(left+.12,bottom+(top-bottom)*.28,floor);
  // Keep the thimble in the lower-right negative space, close enough to share shadows.
  thimble.position.set(Math.min(right-.24,3.65),bottom+.39,0);
  pin.position.set(right-.48,bottom+.018,0);
  offcut.position.set(left+.46,bottom+(top-bottom)*.23,floor);
  // Narrow or nearly square views may leave only corner space around the hero.
  if(!outside(loose.position.x+.68,loose.position.y+.22,.15))loose.position.y=bottom+.28;
  if(!outside(thimble.position.x,thimble.position.y,.27))thimble.position.set(right-.20,bottom+.24,0);
  if(!outside(offcut.position.x+.10,offcut.position.y,.15))offcut.position.y=bottom+.13;
  loose.visible=outside(loose.position.x+.68,loose.position.y+.22,.15);
  thimble.visible=outside(thimble.position.x,thimble.position.y,.27);
  pin.visible=outside(pin.position.x-.08,pin.position.y+.2,.10);
  offcut.visible=outside(offcut.position.x+.10,offcut.position.y,.15);
 }
 const cursor=new THREE.Vector2(),ray=new THREE.Raycaster(),hit=new THREE.Vector3(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),-floor);
 let dirty=false,inside=false,lastMove=-Infinity,bend=0,previousBend=0,velocity=0,highlight=0;
 host.addEventListener('pointermove',e=>{const b=host.getBoundingClientRect();cursor.set((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2);inside=true;dirty=true;lastMove=performance.now()},{passive:true});
 const leave=()=>{inside=false;dirty=false};host.addEventListener('pointerleave',leave);host.addEventListener('pointercancel',leave);host.addEventListener('pointerup',e=>{if(e.pointerType==='touch')leave()},{passive:true});window.addEventListener('blur',leave);
 function update(dt,now){
  if(dirty){ray.setFromCamera(cursor,camera);ray.ray.intersectPlane(plane,hit);dirty=false}
  let target=0,shine=0;
  if(inside&&!reduced.matches){
   if(now-lastMove<100&&loose.visible){let distance=Infinity;for(const [x,y]of points)distance=Math.min(distance,Math.hypot(hit.x-loose.position.x-x,hit.y-loose.position.y-y));if(distance<.12)target=.009*(1-distance/.12)}
   if(thimble.visible)shine=Math.max(0,1-Math.hypot(hit.x-thimble.position.x,hit.y-thimble.position.y)/.22);
  }
  for(let remaining=Math.min(dt,.04);remaining>0;){const h=Math.min(remaining,.008);velocity+=(target-bend)*230*h-velocity*27*h;bend+=velocity*h;remaining-=h}
  if(reduced.matches||(target===0&&Math.abs(bend)<.00001&&Math.abs(velocity)<.0001)){bend=0;velocity=0}
  const a=thread.geometry.attributes.position.array;
  if(bend!==previousBend){for(let i=0;i<a.length;i+=3){const f=Math.max(0,Math.min(1,(threadBase[i]+.65)/1.33));a[i+1]=threadBase[i+1]+bend*Math.sin(f*Math.PI);a[i+2]=threadBase[i+2]+bend*.15*Math.sin(f*Math.PI)}thread.geometry.attributes.position.needsUpdate=true;previousBend=bend}
  highlight+=(shine-highlight)*Math.min(1,dt*12);if(shine===0&&highlight<.0001)highlight=0;steel.roughness=.78-.025*highlight;
 }
 return{layout,update,desk};
}

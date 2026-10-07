import * as THREE from './vendor/three.module.js';

// Desk objects belong to the scene, never to the moving clock assembly.
export function addAtelierDesk({scene,camera,host,radius}){
 const desk=new THREE.Group();desk.name='Sparse atelier remnants';scene.add(desk);
 const floor=-.3;
 const steel=new THREE.MeshStandardMaterial({color:0x98968a,roughness:.78,metalness:.28,vertexColors:true});
 const threadMaterial=new THREE.MeshStandardMaterial({color:0x932b19,roughness:1});
 const shadowMaterial=new THREE.MeshBasicMaterial({color:0x433c2c,transparent:true,opacity:.045,depthWrite:false});
 let invitation=true,invitationHover=false,dragX=0,dragY=0,tugAt=-Infinity,pull=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const add=(geometry,material,parent)=>{const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 function contact(parent,x,y,sx,sy){const m=add(new THREE.CircleGeometry(1,32),shadowMaterial,parent);m.castShadow=false;m.position.set(x,y,floor+.001);m.scale.set(sx,sy,1);return m}
 function lineTube(points,r,material,parent){return add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal'),72,r,5,false),material,parent)}
 const loose=new THREE.Group();desk.add(loose);
 let points=[[-.65,.07,.010],[-.39,.10,.008],[-.16,.045,.006],[.06,-.018,.005],[.22,-.012,.006],[.33,.07,.009],[.31,.18,.012],[.21,.215,.014],[.16,.14,.010],[.23,.052,.006],[.44,.065,.006],[.60,.018,.005],[.68,.055,.004]];
 const thread=lineTube(points,.0042,threadMaterial,loose);
 let threadBase=thread.geometry.attributes.position.array.slice();
 const threadShadow=lineTube(points.map(([x,y])=>[x+.008,y-.011,.0015]),.004,shadowMaterial,loose);threadShadow.castShadow=false;
 let shadowBase=threadShadow.geometry.attributes.position.array.slice();

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
 metal.scale.setScalar(1.65);metal.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(metal,true);metal.position.z=floor-bounds.min.z+.001;
 contact(thimble,.041,-.061,.193,.135);

 const pinSteel=plainSteel.clone();
 const pin=new THREE.Group();desk.add(pin);
 const shaft=add(new THREE.CylinderGeometry(.001,.006,.594,8),pinSteel,pin);shaft.rotation.z=.38;shaft.position.z=floor+.007;
 const head=add(new THREE.SphereGeometry(.017,12,8),new THREE.MeshStandardMaterial({color:0x24241d,roughness:.9}),pin);head.position.set(-Math.sin(.38)*.297,Math.cos(.38)*.297,floor+.012);
 const pinShadow=add(new THREE.PlaneGeometry(.012,.594),shadowMaterial,pin);pinShadow.rotation.z=.38;pinShadow.position.set(.005,-.007,floor+.001);pinShadow.castShadow=false;

 // Two fixed, imperfectly wound spools. Their axes lie on the desktop.
 function spool(color,length,angle){
  const group=new THREE.Group(),body=new THREE.Group();group.add(body);desk.add(group);body.rotation.z=angle;
  const yarn=new THREE.MeshStandardMaterial({color,roughness:1});
  const core=new THREE.MeshStandardMaterial({color:0xb99b78,roughness:.94});
  const barrel=add(new THREE.CylinderGeometry(.117,.121,length,48),yarn,body);barrel.rotation.z=Math.PI/2;barrel.position.z=floor+.139;
  const axle=add(new THREE.CylinderGeometry(.048,.048,length+.09,20),core,body);axle.rotation.z=Math.PI/2;axle.position.z=floor+.139;
  for(const side of [-1,1]){
   const rim=add(new THREE.TorusGeometry(.125,.009,8,48),core,body);rim.rotation.y=Math.PI/2;rim.position.set(side*(length/2+.025),0,floor+.139);
   const shape=new THREE.Shape();shape.absarc(0,0,.13,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,.047,0,Math.PI*2,true);shape.holes.push(hole);
   const flange=add(new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false,curveSegments:32}),core,body);flange.rotation.y=Math.PI/2;flange.position.set(side*(length/2+.022),0,floor+.139);
  }
  const coil=[];for(let i=0;i<=2304;i++){const t=i/2304,a=t*Math.PI*2*96,r=.121+.0023*Math.sin(a*.071)+.0015*Math.sin(a*.31);coil.push(new THREE.Vector3((t-.5)*length,Math.cos(a)*r,floor+.139+Math.sin(a)*r))}
  const fiber=new THREE.MeshStandardMaterial({color,roughness:1});fiber.color.multiplyScalar(1.09);
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil),2304,.0024,4,false),fiber,body);
  const shade=contact(body,.027,-.038,length*.56,.10);shade.rotation.z=0;
  return group;
 }
 const leftSpool=spool(0x932b19,.55,.13),rightSpool=spool(0xd2c5a5,.43,-.79);
 function loosePin(angle,length,color){
  const group=new THREE.Group();desk.add(group);group.rotation.z=angle;
  const shaft=add(new THREE.CylinderGeometry(.0005,.004,length,10),pinSteel,group);shaft.position.z=floor+.016;
  const ball=add(new THREE.SphereGeometry(.019,12,8),new THREE.MeshStandardMaterial({color,roughness:.8}),group);ball.position.set(0,-length/2,floor+.020);
  const shadow=add(new THREE.PlaneGeometry(.007,length),shadowMaterial,group);shadow.position.set(.005,-.007,floor+.001);shadow.castShadow=false;
  return group;
 }
 const crossingPin=loosePin(1.17,.64,0x24241d),nearSpoolPin=loosePin(-.61,.48,0xb92717);

 function outside(x,y,padding){return Math.hypot(x,y)>radius+padding}
 let anchor={x:0,y:0},threadSpan=1,threadTop=0;
 function layout(){
  const left=camera.left,right=camera.right,bottom=camera.bottom,top=camera.top;
  // One tail passes below the felt; all other remnants stay clear of its silhouette.
  const y=right<3.5?-radius+.19:-1.15;
  const edge=-Math.sqrt(radius*radius-y*y),start=left-.22;
  threadSpan=edge+.10-start;
  const loop=Math.min(1.45,threadSpan*.62),v=Math.min(.68,loop*.50);
  points=[[0,-.07,.007],[.25,-.11,.006],[loop*.48,-.08,.008],[loop*.78,.12,.011],[loop*.80,v,.013],[loop*.48,v*.92,.012],[loop*.40,v*.42,.010],[loop*.66,.02,.007],[loop*.96,-.06,.006],[loop*1.08,.07,.008],[loop*1.22,.015,.005],[threadSpan*.85,-.02,.004],[threadSpan,0,.004]];
  loose.position.set(start,y,floor);
  // The feed meets the winding at the cropped spool's lower tangent.
  leftSpool.position.set(left+.12,y+.038,0);
  points[0]=[leftSpool.position.x-start,.038,.021];
  points.splice(1,0,[-.10,-.15,.007]);
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
  thread.geometry.dispose();thread.geometry=new THREE.TubeGeometry(path,120,.0042,5,false);threadBase=thread.geometry.attributes.position.array.slice();
  const shadowPath=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x+.008,y-.011,.0015)),false,'centripetal');
  threadShadow.geometry.dispose();threadShadow.geometry=new THREE.TubeGeometry(shadowPath,120,.005,5,false);shadowBase=threadShadow.geometry.attributes.position.array.slice();
  anchor={x:start+loop*.88,y:y-.17};threadTop=y+v;
  const tx=Math.min(right-.43,2.96),ty=Math.max(bottom+.69,-2.39);
  thimble.position.set(tx,ty,0);
  // In square views, use the lower-right corner's available diagonal space.
  if(!outside(tx,ty,.55))thimble.position.set(right-.36,bottom+.60,0);
  rightSpool.position.set(thimble.position.x+.24,thimble.position.y-.55,0);
  pin.position.set(Math.min(right-.28,thimble.position.x+.58),bottom+.035,0);
  crossingPin.position.set(start+loop*.95,y-.04,0);
  nearSpoolPin.position.set(left+(y-.90<bottom+.20?1.15:.27),Math.max(bottom+.20,y-.90),0);
  loose.visible=true;thimble.visible=true;pin.visible=outside(pin.position.x-.13,pin.position.y+.31,.08);

 }
 const cursor=new THREE.Vector2(),ray=new THREE.Raycaster(),hit=new THREE.Vector3(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),-floor);
 let dirty=false,inside=false,lastMove=-Infinity,bend=0,velocity=0,highlight=0;
 host.addEventListener('pointermove',e=>{const b=host.getBoundingClientRect();cursor.set((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2);inside=true;dirty=true;lastMove=performance.now()},{passive:true});
 const leave=()=>{inside=false;dirty=false};host.addEventListener('pointerleave',leave);host.addEventListener('pointercancel',leave);host.addEventListener('pointerup',e=>{if(e.pointerType==='touch')leave()},{passive:true});window.addEventListener('blur',leave);
 function update(dt,now){
  if(dirty){ray.setFromCamera(cursor,camera);ray.ray.intersectPlane(plane,hit);dirty=false}
  let target=0,shine=0;
  if(inside&&!reduced.matches){
   if(now-lastMove<100&&loose.visible){let distance=Infinity;for(const [x,y]of points)distance=Math.min(distance,Math.hypot(hit.x-loose.position.x-x,hit.y-loose.position.y-y));if(distance<.12)target=.009*(1-distance/.12)}
   if(thimble.visible)shine=Math.max(0,1-Math.hypot(hit.x-thimble.position.x,hit.y-thimble.position.y)/.45);
  }
  for(let remaining=Math.min(dt,.04);remaining>0;){const h=Math.min(remaining,.008);velocity+=(target-bend)*230*h-velocity*27*h;bend+=velocity*h;remaining-=h}
  if(reduced.matches||(target===0&&Math.abs(bend)<.00001&&Math.abs(velocity)<.0001)){bend=0;velocity=0}
  const rect=host.getBoundingClientRect(),pixel=(camera.right-camera.left)/rect.width;
  const cycle=now%3300,idle=invitation&&cycle<360?3*Math.sin(cycle/360*Math.PI)**2:0;
  const elapsed=now-tugAt,tug=elapsed>=0&&elapsed<650?18*Math.sin(Math.min(1,elapsed/100)*Math.PI/2)*Math.exp(-Math.max(0,elapsed-100)/120):0;
  const targetPull=reduced.matches?0:(invitationHover&&invitation?4:idle)+tug;
  pull+=(targetPull-pull)*Math.min(1,dt*20);if(targetPull===0&&pull<.001)pull=0;
  const toward=new THREE.Vector2(-loose.position.x-threadSpan,-loose.position.y).normalize();
  const xPull=directionValue(toward.x*pull+ (invitation?dragX:0)),yPull=directionValue(toward.y*pull-(invitation?dragY:0));
  function directionValue(value){return reduced.matches?0:value*pixel}
  const a=thread.geometry.attributes.position.array,shadow=threadShadow.geometry.attributes.position.array;
  for(let i=0;i<a.length;i+=3){const f=Math.max(0,Math.min(1,threadBase[i]/threadSpan)),weight=f**1.7,wave=bend*Math.sin(f*Math.PI);
   a[i]=threadBase[i]+xPull*weight;a[i+1]=threadBase[i+1]+wave+yPull*weight;a[i+2]=threadBase[i+2]+wave*.15;
   shadow[i]=shadowBase[i]+xPull*weight;shadow[i+1]=shadowBase[i+1]+wave+yPull*weight;
  }
  thread.geometry.attributes.position.needsUpdate=true;threadShadow.geometry.attributes.position.needsUpdate=true;
  highlight+=(shine-highlight)*Math.min(1,dt*12);if(shine===0&&highlight<.0001)highlight=0;steel.roughness=.78-.025*highlight;
 }
 return{layout,update,desk,
  invite({hover=false,x=0,y=0}){if(invitation){invitationHover=hover;dragX=x;dragY=y}},
  activateInvitation(){if(!invitation)return;invitation=false;invitationHover=false;dragX=dragY=0;tugAt=performance.now()},
  invitationAnchor(){const rect=host.getBoundingClientRect();const project=(x,y)=>({x:(x-camera.left)/(camera.right-camera.left)*rect.width,y:(camera.top-y)/(camera.top-camera.bottom)*rect.height});return{end:project(anchor.x,anchor.y),top:project(0,threadTop).y}}
 };
}

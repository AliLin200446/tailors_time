export const PIN_START=120,PIN_STEP=145,PIN_DURATION=240;
export const PINS_DONE=PIN_START+11*PIN_STEP+PIN_DURATION;
export const REVEAL_START=PINS_DONE+300,ACTIVE_AT=REVEAL_START+550;
const clamp=x=>Math.max(0,Math.min(1,x));
export function pinProgress(time,index){return clamp((time-PIN_START-index*PIN_STEP)/PIN_DURATION)}
export function steelProgress(u){u=clamp(u);if(u===1)return 1;const travel=(1-(1+12*u)*Math.exp(-12*u))/(1-13*Math.exp(-12));const settle=u>.65?.007*Math.sin((u-.65)/.35*Math.PI):0;return travel+settle}
export function snipImpulse(ms){if(ms<0||ms>=340)return 0;if(ms<100)return Math.sin(ms/100*Math.PI/2);return Math.cos((ms-100)/240*Math.PI/2)*Math.exp(-(ms-100)/110)}
export function addTemporalBehavior({tapeGeometries,pins,minute,hour,needle,materialDetails,playContact,playSnip}){
 const rest=-.42;
 let started=false,elapsed=0,restored=false,active=false,revealSound=false,cutElapsed=Infinity,cutLayer=null;
 const sounded=new Set();
 const snapshots=tapeGeometries.map(g=>({g,positions:g.attributes.position.array.slice(),normals:g.attributes.normal?.array.slice()}));
 function restoreTape(){for(const s of snapshots){s.g.attributes.position.array.set(s.positions);s.g.attributes.position.needsUpdate=true;if(s.normals){s.g.attributes.normal.array.set(s.normals);s.g.attributes.normal.needsUpdate=true}}restored=true}
 function insertPins(){for(let i=0;i<pins.length;i++){const {group,hole}=pins[i],p=pinProgress(elapsed,i);group.visible=p>0;hole.visible=p>.53;let height;if(p<.40)height=.28*(1-(p/.40)**2);else if(p<.57)height=-.012*Math.sin((p-.40)/.17*Math.PI/2);else height=-.012*Math.exp(-(p-.57)*13)*Math.cos((p-.57)*18);if(p===1)height=0;group.position.set(0,0,height);hole.scale.setScalar(1+(p>.53&&p<1?.65*Math.exp(-(p-.53)*12):0));if(p>=.53&&!sounded.has(i)){sounded.add(i);playContact(.5)}}}
 function tensionTape(){if(restored)return;if(elapsed>=PINS_DONE){restoreTape();return}for(const s of snapshots){const a=s.g.attributes.position.array;for(let j=0;j<a.length;j+=3){const x=s.positions[j],y=s.positions[j+1],r=Math.hypot(x,y),phase=((Math.atan2(x,y)/(2*Math.PI)+1)%1)*12,i=Math.floor(phase),f=phase-i;const left=pinProgress(elapsed,i),right=pinProgress(elapsed,(i+1)%12);const held=(1-f)*left+f*right,slack=1-held;const bow=.033*Math.sin(phase*Math.PI)*slack;a[j]=x+x/r*bow;a[j+1]=y+y/r*bow;a[j+2]=s.positions[j+2]+(.045+.07*Math.sin(f*Math.PI)**2)*slack} s.g.attributes.position.needsUpdate=true;if(s.normals)s.g.computeVertexNormals()}}
 function cut(layer){cutElapsed=0;cutLayer=layer;if(layer){const lines=layer.group.children.filter(o=>o.isLine);layer.cutEnds=[lines[0],lines.at(-1)].filter(Boolean).map(line=>({line,base:line.geometry.attributes.position.array.slice()}))}playSnip()}
 function update(dt,angles){if(!started)return false;elapsed+=Math.min(dt,.04)*1000;
  if(!active){insertPins();tensionTape();needle.visible=false;materialDetails.setThreadVisible(false);if(elapsed<REVEAL_START){minute.group.rotation.z=rest-.015;hour.group.rotation.z=rest+.015;return false}if(!revealSound){revealSound=true;playSnip()}const progress=steelProgress((elapsed-REVEAL_START)/550);for(const [part,target,offset]of[[minute,angles[0],-.015],[hour,angles[1],.015]]){const from=rest+offset,delta=Math.atan2(Math.sin(target-from),Math.cos(target-from));part.group.rotation.z=from+delta*progress}if(elapsed<ACTIVE_AT)return false;active=true;needle.visible=true;materialDetails.setThreadVisible(true);materialDetails.reset(angles[2]);playContact(.65)}
  minute.group.rotation.z=angles[0];hour.group.rotation.z=angles[1];
  const impulse=snipImpulse(cutElapsed),gap=Math.atan2(Math.sin(angles[0]-angles[1]),Math.cos(angles[0]-angles[1])),amount=Math.min(.022,Math.max(.006,Math.abs(gap)*.18)),direction=Math.sign(gap)||1;minute.group.rotation.z-=direction*amount*impulse;hour.group.rotation.z+=direction*amount*impulse;
  if(cutLayer?.cutEnds){const release=Math.exp(-cutElapsed/180)*Math.sin(Math.min(1,cutElapsed/120)*Math.PI/2);for(let e=0;e<cutLayer.cutEnds.length;e++){const{line,base}=cutLayer.cutEnds[e],a=line.geometry.attributes.position.array;for(let j=0;j<a.length;j+=3){const weight=e===0?1-j/(a.length-3):j/(a.length-3);a[j]=base[j]+(e===0?-1:1)*.028*weight*release;a[j+1]=base[j+1]-.009*weight*release;a[j+2]=base[j+2]+.018*weight*release}line.geometry.attributes.position.needsUpdate=true}if(cutElapsed>1200){for(const{line,base}of cutLayer.cutEnds){line.geometry.attributes.position.array.set(base);line.geometry.attributes.position.needsUpdate=true}delete cutLayer.cutEnds;cutLayer=null}}
  cutElapsed+=dt*1000;return true;
 }
 function skipCut(){cutElapsed=Infinity;if(cutLayer?.cutEnds){for(const{line,base}of cutLayer.cutEnds){line.geometry.attributes.position.array.set(base);line.geometry.attributes.position.needsUpdate=true}delete cutLayer.cutEnds}cutLayer=null}
 insertPins();tensionTape();needle.visible=false;materialDetails.setThreadVisible(false);minute.group.rotation.z=rest-.015;hour.group.rotation.z=rest+.015;
 return{start(){started=true},update,cut,skipCut,get active(){return active}};
}

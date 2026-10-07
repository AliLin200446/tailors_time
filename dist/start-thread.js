// A semantic, keyboard-accessible hit target with no conventional button styling.
export function addThreadStart({desk,wake,unlock}){
 const button=document.createElement('button');button.className='thread-start';button.type='button';
 const label=document.createElement('span');label.textContent='PULL TO START';button.append(label);document.body.append(button);
 let done=false,pointer=null,origin=null;
 const finish=()=>{if(!done)wake()};
 button.addEventListener('pointerenter',()=>desk.invite({hover:true}));
 button.addEventListener('pointerleave',()=>{if(pointer===null)desk.invite({hover:false})});
 button.addEventListener('focus',()=>desk.invite({hover:true}));
 button.addEventListener('blur',()=>desk.invite({hover:false}));
 button.addEventListener('pointerdown',e=>{
  if(done||e.button!==0)return;
  pointer=e.pointerId;origin={x:e.clientX,y:e.clientY};button.setPointerCapture(e.pointerId);
  unlock(); // Called within the trusted gesture; the opening still awaits click/pull.
  if(e.pointerType==='touch')finish();
 });
 button.addEventListener('pointermove',e=>{
  if(done||e.pointerId!==pointer)return;
  const dx=e.clientX-origin.x,dy=e.clientY-origin.y,length=Math.hypot(dx,dy),scale=Math.min(1,32/Math.max(1,length));
  desk.invite({hover:true,x:dx*scale,y:dy*scale});if(length>=18)finish();
 });
 button.addEventListener('pointerup',e=>{if(e.pointerId===pointer){pointer=null;finish()}});
 button.addEventListener('pointercancel',()=>{pointer=null;desk.invite({hover:false,x:0,y:0})});
 button.addEventListener('click',finish); // Includes Enter, Space and assistive technology.
 function layout(){if(done)return;const {end,top}=desk.invitationAnchor();
  const labelX=Math.max(10,end.x-86),labelY=end.y+14;
  const x=Math.max(0,Math.min(labelX-10,end.x-105)),y=Math.max(0,top-16);
  button.style.left=`${x}px`;button.style.top=`${y}px`;button.style.width=`${Math.max(120,end.x+22-x,labelX+106-x)}px`;button.style.height=`${Math.max(44,labelY+28-y)}px`;
  label.style.left=`${labelX-x}px`;label.style.top=`${labelY-y}px`;
 }
 layout();
 return{layout,contains:target=>button.contains(target),activate(){if(done)return;done=true;desk.activateInvitation();button.remove()}};
}

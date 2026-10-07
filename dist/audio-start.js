// One context per visit. A suspended context is a waiting state, not a failure.
export function createAudioStart({createContext,prepare,onStart,onFailure=()=>{}}){
 let context=null,started=false,requested=false,failed=false,pending=false;
 const check=()=>{if(requested&&!started&&!failed&&context?.state==='running'){started=true;onStart()}};
 function fail(){if(failed)return;failed=true;onFailure();if(requested&&!started){started=true;onStart()}}
 async function resume(){
  if(failed){if(requested&&!started){started=true;onStart()}return;}
  try{
   if(!context){context=createContext();prepare(context);context.addEventListener('statechange',check)}
   if(context.state==='closed'){fail();return}
   if(context.state==='running'){check();return}
   if(pending)return;
   pending=true;
   try{await context.resume();check()}finally{pending=false}
  }catch{fail()}
 }
 return{wake(){requested=true;return resume()},unlock:resume,get context(){return context},get audible(){return !failed&&context?.state==='running'},get canAdvance(){return failed||context?.state==='running'}};
}

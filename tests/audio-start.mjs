import assert from 'node:assert/strict';
import {createAudioStart} from '../dist/audio-start.js';
class Context extends EventTarget {
 state='suspended';calls=0;
 resume(){this.calls++;return new Promise(resolve=>{this.resolve=resolve})}
 run(){this.state='running';this.dispatchEvent(new Event('statechange'));this.resolve?.()}
}
let creations=0,starts=0;const context=new Context();
const gate=createAudioStart({createContext:()=>{creations++;return context},prepare:()=>{},onStart:()=>starts++});
assert.equal(creations,0);assert.equal(starts,0);assert.equal(gate.canAdvance,false);
const pending=gate.wake();await gate.wake();await gate.wake();
assert.equal(creations,1);assert.equal(context.calls,1);assert.equal(starts,0);
context.run();await pending;assert.equal(starts,1);assert.equal(gate.audible,true);
await gate.wake();assert.equal(starts,1);
context.state='suspended';assert.equal(gate.canAdvance,false);
const resumed=gate.wake();context.run();await resumed;assert.equal(starts,1);
for(const mode of ['constructor','prepare','resume']){
 let fallback=0,warnings=0;
 const failed=createAudioStart({createContext:()=>{if(mode==='constructor')throw Error();return {state:'suspended',addEventListener(){},resume(){return Promise.reject(Error())}}},prepare:()=>{if(mode==='prepare')throw Error()},onStart:()=>fallback++,onFailure:()=>warnings++});
 await failed.wake();await failed.wake();assert.equal(fallback,1);assert.equal(warnings,1);assert.equal(failed.canAdvance,true);assert.equal(failed.audible,false);
}
console.log('PASS: gesture gate, shared context, concurrent gestures, resume, no replay, visual fallback.');
// A pointer press can unlock sound without starting; a short pull or release commits it.
let pullStarts=0;const pullContext=new Context();
const pullGate=createAudioStart({createContext:()=>pullContext,prepare:()=>{},onStart:()=>pullStarts++});
const unlocking=pullGate.unlock();pullContext.run();await unlocking;
assert.equal(pullGate.audible,true);assert.equal(pullStarts,0);
await pullGate.wake();assert.equal(pullStarts,1);await pullGate.wake();assert.equal(pullStarts,1);
let failedPullStarts=0;
const failedPull=createAudioStart({createContext:()=>{throw Error()},prepare:()=>{},onStart:()=>failedPullStarts++});
await failedPull.unlock();assert.equal(failedPullStarts,0);await failedPull.wake();assert.equal(failedPullStarts,1);
console.log('PASS: pull unlock is separate from opening; release starts once, including audio failure.');

const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname,'../assets/inquiry-form.js'),'utf8');
function setup(fetchImpl) {
  const status = { style:{}, classList:{toggle(){}}, textContent:'' };
  const button = {disabled:false};
  const fields = {name:'Visitor',email:'visitor@example.com',phone:'',message:'Test',website:'',projectType:'Custom Home'};
  let submit; let resets=0; let valid=true; let reports=0;
  const form = { querySelector:()=>button, addEventListener:(_event,fn)=>{submit=fn;}, checkValidity:()=>valid, reportValidity:()=>reports++, setAttribute(){},removeAttribute(){}, reset(){resets++;} };
  const context = {document:{getElementById:id=>id==='projectForm'?form:status}, location:{protocol:'http:'}, crypto:{randomUUID:()=>require('node:crypto').randomUUID()}, FormData:class{constructor(){return Object.entries(fields);}}, fetch:fetchImpl, AbortController, setTimeout,clearTimeout};
  vm.runInNewContext(source,context);
  return {status,button,fields, submit:()=>submit({preventDefault(){}}), resets:()=>resets,reports:()=>reports, invalid:()=>{valid=false;} };
}
test('success only follows provider acceptance and clears unchanged draft',async()=>{
  const ui=setup(async()=>({ok:true,json:async()=>({accepted:true})}));await ui.submit();
  assert.match(ui.status.textContent,/Our email service accepted your inquiry for delivery to Matt/);assert.equal(ui.resets(),1);assert.equal(ui.button.disabled,false);
});
test('error keeps draft and reuses request id when retrying',async()=>{
  const calls=[];const ui=setup(async(_url,opts)=>{calls.push(JSON.parse(opts.body));return{ok:false,json:async()=>({error:'Service unavailable'})};});
  await ui.submit();await ui.submit();assert.equal(ui.resets(),0);assert.equal(calls[0].requestId,calls[1].requestId);assert.equal(ui.status.textContent,'Service unavailable');
  ui.fields.message='A changed draft';await ui.submit();assert.notEqual(calls[1].requestId,calls[2].requestId);
});
test('prevents duplicate pending requests and retains edits made while pending',async()=>{
  let resolve;let calls=0;const ui=setup(()=>{calls++;return new Promise(r=>{resolve=r;});});
  const pending=ui.submit();await ui.submit();assert.equal(calls,1);assert.equal(ui.button.disabled,true);
  ui.fields.message='New draft';resolve({ok:true,json:async()=>({accepted:true})});await pending;assert.equal(ui.resets(),0);
});
test('unconfirmed and broken responses do not clear input or claim success',async()=>{
  for(const fetchImpl of [async()=>({ok:true,json:async()=>({})}),async()=>{throw Error('network');},async()=>({ok:false,json:async()=>{throw Error('not JSON');}})]){
    const ui=setup(fetchImpl);await ui.submit();assert.equal(ui.resets(),0);assert.match(ui.status.textContent,/could not confirm/);assert.equal(ui.button.disabled,false);
  }
});
test('native field validation runs before sending',async()=>{
  let calls=0;const ui=setup(async()=>{calls++;});ui.invalid();await ui.submit();assert.equal(calls,0);assert.equal(ui.reports(),1);
});

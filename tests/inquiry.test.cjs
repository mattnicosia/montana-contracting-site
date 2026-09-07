const test = require('node:test');
const assert = require('node:assert/strict');
const { createInquiryHandler } = require('../server/inquiry.cjs');

const env = { RESEND_API_KEY: 'test-only-key', INQUIRY_FROM: 'website@montanacontracting.com' };
const valid = { name: 'Test Visitor', email: 'visitor@example.com', phone: '', projectType: 'Custom Home', message: 'A local test, never sent.', website: '', requestId: '8fb3485c-943b-4d7b-9fe1-a9aa1f065008' };
function request(body = valid, headers = {}) {
  return { method: 'POST', body, headers: { origin: 'https://montanacontracting.com', 'content-type': 'application/json', ...headers }, socket: { remoteAddress: '127.0.0.1' } };
}
async function run(handler, req = request()) {
  const result = { headers: {} };
  const res = { setHeader(k,v) { result.headers[k] = v; }, status(s) { result.status = s; return this; }, json(b) { result.body = b; } };
  await handler(req,res);
  return result;
}
function setup(overrides = {}) {
  const calls = [];
  const handler = createInquiryHandler({ env, fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 200, json: async () => ({ id: 'provider-receipt' }) }; }, ...overrides });
  return {handler,calls};
}
test('accepted inquiry uses fixed recipient and visitor Reply-To', async () => {
  const {handler,calls} = setup(); const r = await run(handler);
  assert.equal(r.status,200); assert.deepEqual(r.body,{accepted:true});
  const mail = JSON.parse(calls[0][1].body);
  assert.deepEqual(mail.to,['matt@montanacontracting.com']); assert.equal(mail.reply_to,valid.email);
  assert.equal(mail.from,env.INQUIRY_FROM); assert.match(mail.text,/A local test/);
  assert.equal(r.headers['Cache-Control'],'no-store'); assert.equal(calls[0][0],'https://api.resend.com/emails');
});
test('retries keep provider idempotency key stable; changed payload changes key',async()=>{
  const {handler,calls}=setup(); await run(handler); await run(handler); await run(handler,request({...valid,message:'Changed'}));
  assert.equal(calls[0][1].headers['Idempotency-Key'],calls[1][1].headers['Idempotency-Key']);
  assert.notEqual(calls[1][1].headers['Idempotency-Key'],calls[2][1].headers['Idempotency-Key']);
});
for (const [name,change,status] of [
  ['missing name',{name:''},422],['invalid email',{email:'invalid'},422],['header injection',{email:'a@example.com\r\nBcc:other@example.com'},422],
  ['invalid project type',{projectType:'Spam'},422],['long message',{message:'x'.repeat(5001)},422],['honeypot',{website:'https://spam.example'},422],
  ['recipient override',{to:'other@example.com'},422],['no request id',{requestId:''},422],['nested field',{name:{}},422]
]) test(name,async()=>{const {handler,calls}=setup(); assert.equal((await run(handler,request({...valid,...change}))).status,status);assert.equal(calls.length,0);});
test('rejects malformed JSON, oversized body, wrong method and media type',async()=>{
  const {handler,calls}=setup();
  assert.equal((await run(handler,request('{'))).status,400);
  assert.equal((await run(handler,request('x'.repeat(17000)))).status,413);
  assert.equal((await run(handler,{...request(),method:'GET'})).status,405);
  assert.equal((await run(handler,request(valid,{'content-type':'text/plain'}))).status,415);
  assert.equal(calls.length,0);
});
test('only permits approved origins, including exact preview deployment',async()=>{
  const {handler,calls}=setup({env:{...env,VERCEL_URL:'preview.vercel.app'}});
  for(const origin of ['https://evil.example','null','https://montanacontracting.com.evil.example',undefined]) assert.equal((await run(handler,request(valid,{origin}))).status,403);
  assert.equal((await run(handler,request(valid,{origin:'https://www.montanacontracting.com'}))).status,200);
  assert.equal((await run(handler,request(valid,{origin:'https://preview.vercel.app'}))).status,200);
  assert.equal(calls.length,2);
});
test('missing key or verified Montana sender fails closed',async()=>{
  for(const config of [{},{RESEND_API_KEY:'test'}, {...env,INQUIRY_FROM:'person@unrelated.com'}]) {
    const {handler,calls}=setup({env:config});assert.equal((await run(handler)).status,503);assert.equal(calls.length,0);
  }
});
test('provider rejection, missing receipt, and network error never report acceptance',async()=>{
  for(const fetchImpl of [async()=>({ok:false,status:429,json:async()=>({message:'private service detail'})}),async()=>({ok:true,json:async()=>({})}),async()=>{throw Error('secret');}]){
    const r=await run(setup({fetchImpl}).handler); assert.equal(r.status,502);assert.equal(r.body.accepted,undefined);assert.doesNotMatch(JSON.stringify(r),/secret|private service/);
  }
});
test('provider timeout is bounded',async()=>{
  const fetchImpl=(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout'))));
  const r=await run(setup({fetchImpl,timeoutMs:10}).handler);assert.equal(r.status,502);
});
test('repeated requests receive local throttle without another send',async()=>{
  const {handler,calls}=setup(); for(let i=0;i<5;i++)assert.equal((await run(handler)).status,200);
  const r=await run(handler);assert.equal(r.status,429);assert.equal(calls.length,5);assert.equal(r.headers['Retry-After'],'60');
});

/* Isolated API checks: fetch is mocked. No enquiry is sent. */
const assert=require('assert/strict'),handler=require('../api/contact');
const names=['RESEND_API_KEY','CONTACT_TO','CONTACT_FROM'];
const saved=Object.fromEntries(names.map(k=>[k,process.env[k]]));
const originalFetch=global.fetch;
async function call(method,body){const response={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(value){this.value=value;return this;}};await handler({method,body},response);return response;}
(async()=>{
 try{
  for(const k of names)delete process.env[k];
  assert.equal((await call('GET')).code,405);
  assert.equal((await call('POST','bad json')).code,400);
  assert.equal((await call('POST',{name:'Test',email:'invalid',message:'Brief'})).code,422);
  const payload={name:'Preview test',email:'test@example.com',brand:'Example & Brand',projectType:'Film & music promotion',message:'<script>must be escaped</script>',company:''};
  assert.equal((await call('POST',payload)).code,503,'Missing delivery configuration must not claim success');
  for(const k of names)process.env[k]='test-only';
  let delivery=null;
  global.fetch=async(url,opts)=>{delivery=JSON.parse(opts.body);return {ok:true};};
  assert.equal((await call('POST',payload)).code,200);
  assert(delivery.text.includes('Brand: Example & Brand'));
  assert(delivery.text.includes('Project type: Film & music promotion'));
  assert(delivery.html.includes('&lt;script&gt;')&&!delivery.html.includes('<script>'));
  delivery=null;await call('POST',{...payload,company:'spam'});assert.equal(delivery,null,'Spam must not reach provider');
  global.fetch=async()=>({ok:false,status:500,text:async()=> 'Mock provider failure'});
  assert.equal((await call('POST',payload)).code,502);
  console.log('Contact API checks passed: validation, honeypot, brand/project delivery, escaping and failure handling; no emails sent.');
 }finally{global.fetch=originalFetch;for(const k of names){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}}
})().catch(e=>{console.error(e);process.exitCode=1;});

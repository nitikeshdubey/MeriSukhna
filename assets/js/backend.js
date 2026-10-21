/* Small Supabase REST client. No credentials are bundled in the website. */
(() => {
 const config=window.MS_BACKEND||{},key='ms-session-v1';let session=null,refreshing=null;
 const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url||'')&&/^(sb_publishable_|eyJ)/.test(config.publishableKey||'');
 try{session=JSON.parse(sessionStorage.getItem(key));}catch{}
 function remember(value){session=value;try{value?sessionStorage.setItem(key,JSON.stringify(value)):sessionStorage.removeItem(key);}catch{}}
 async function request(path,{method='GET',body,auth=true,headers={}}={}){
  if(!configured)throw new Error('Secure accounts are awaiting backend connection. You can still customise a package and contact us on WhatsApp.');
  if(auth&&session&&session.expires_at<Date.now()/1000+60){if(!refreshing)refreshing=refresh().finally(()=>refreshing=null);await refreshing;}
  const response=await fetch(config.url+path,{method,headers:{apikey:config.publishableKey,...(auth&&session?{Authorization:'Bearer '+session.access_token}:{}),...(body instanceof Blob?{}:{'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:body instanceof Blob?body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=null;}
  if(!response.ok){if(response.status===401&&auth)remember(null);throw new Error(data?.msg||data?.message||data?.error_description||'The request could not be completed. Please try again.');}return data;
 }
 async function refresh(){try{const value=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:{refresh_token:session.refresh_token}});remember({...value,expires_at:Date.now()/1000+value.expires_in});}catch(error){remember(null);throw error;}}
 window.MS_API={configured,get user(){return session?.user||null;},async login(email,password){const data=await request('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password}});remember({...data,expires_at:Date.now()/1000+data.expires_in});return data.user;},async signup(email,password){return request('/auth/v1/signup',{method:'POST',auth:false,body:{email,password}});},async logout(){try{await request('/auth/v1/logout',{method:'POST'});}finally{remember(null);}},async table(name,query=''){return request('/rest/v1/'+name+'?'+query);},async rpc(name,body){return request('/rest/v1/rpc/'+name,{method:'POST',body});},async upload(path,file){return request('/storage/v1/object/completion/'+path,{method:'POST',body:file,headers:{'Content-Type':file.type,'x-upsert':'false'}});},async mediaUrl(path){const data=await request('/storage/v1/object/sign/completion/'+path,{method:'POST',body:{expiresIn:60}});return config.url+'/storage/v1'+data.signedURL;},async publicReviews(){return request('/rest/v1/rpc/published_reviews',{method:'POST',auth:false,body:{}});}};
})();

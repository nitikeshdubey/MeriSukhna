import nodemailer from "npm:nodemailer@10.3.1";
const allowedOrigins=["https://merisukhna.com","https://www.merisukhna.com","https://nitikeshdubey.github.io"];
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 const headers={"Access-Control-Allow-Origin":allowedOrigins.includes(origin)?origin:allowedOrigins[0],"Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Vary":"Origin"};
 const reply=(status:number,message:string)=>new Response(JSON.stringify({message}),{status,headers});
 if(!allowedOrigins.includes(origin))return reply(403,"Origin not allowed");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply(405,"Method not allowed");

 const url=Deno.env.get("SUPABASE_URL")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, password=Deno.env.get("SMTP_PASSWORD");
 if(!password)return reply(503,"Email delivery is awaiting activation");
 const authorization=req.headers.get("authorization")||"";
 if(!authorization.startsWith("Bearer "))return reply(401,"Sign in required");
 let id:string;
 try{const body=await req.json();id=body.request_id;if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))return reply(400,"Invalid reference");}catch{return reply(400,"Invalid request");}
 const userResponse=await fetch(url+"/auth/v1/user",{headers:{apikey:service,Authorization:authorization}});
 if(!userResponse.ok)return reply(401,"Sign in required");
 const user=await userResponse.json();
 if(!user.email_confirmed_at||!user.email)return reply(403,"Confirm your email first");
 const adminHeaders={apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"};
 const data=await fetch(url+"/rest/v1/ms_requests?id=eq."+id+"&owner_id=eq."+encodeURIComponent(user.id)+"&select=id,created_at",{headers:adminHeaders});
 if(!data.ok)return reply(503,"Please try again later");
 const rows=await data.json();if(!rows.length)return reply(404,"Request not found");
 // Old requests cannot be used to send repeated unsolicited receipts.
 if(Date.now()-Date.parse(rows[0].created_at)>86400000)return reply(400,"Receipt window expired");
 const rpc=async(name:string,body:object)=>fetch(url+"/rest/v1/rpc/"+name,{method:"POST",headers:adminHeaders,body:JSON.stringify(body)});
 const claim=await rpc("claim_request_receipt",{request_id:id});
 if(!claim.ok)return reply(503,"Please try again later");
 if(!await claim.json())return reply(200,"Receipt already queued or sent");
 const transport=nodemailer.createTransport({host:"smtp.hostinger.com",port:465,secure:true,auth:{user:"contact@merisukhna.com",pass:password},connectionTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true});
 try{
  await transport.sendMail({from:'"Meri Sukhna" <contact@merisukhna.com>',to:user.email,replyTo:"contact@merisukhna.com",subject:"Your Meri Sukhna request has been received",text:"Sat Sri Akal Ji,\n\nYour request has been saved.\nReference: "+id+"\n\nOur team will review availability and prepare a written quotation. This receipt is not a confirmed booking. Arrangements and the total must be agreed before proceeding.\n\nView your request: https://merisukhna.com/account.html#"+id+"\n\nContact: contact@merisukhna.com\nWhatsApp: +91 77175 34949"});
  const saved=await rpc("finish_request_receipt",{request_id:id,delivered:true});
  if(!saved.ok)return reply(503,"Delivery status pending");
  return reply(200,"Receipt sent");
 }catch{
  await rpc("finish_request_receipt",{request_id:id,delivered:false});
  return reply(503,"Receipt could not be sent; your saved request is safe");
 }finally{transport.close();}
});

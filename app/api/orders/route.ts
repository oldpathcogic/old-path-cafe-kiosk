import { db, getMenu, requireAdmin } from "../../../lib/store";

type CartLine={itemId?:string;option?:string;addonIds?:string[]};

export async function GET(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Staff PIN required"},{status:401});
  try{
    await getMenu();
    const database=db();
    const rows=await database.prepare("SELECT * FROM orders WHERE status IN ('new','in_progress','ready') ORDER BY created_at ASC").all<Record<string,unknown>>();
    const orders=[];
    for(const row of rows.results){const items=await database.prepare("SELECT * FROM order_items WHERE order_id=? ORDER BY id").bind(row.id).all<Record<string,unknown>>();orders.push({id:row.id,customerName:row.customer_name,status:row.status,subtotalCents:row.subtotal_cents,totalCents:row.total_cents,paymentRequired:Number(row.payment_required)===1,paymentStatus:row.payment_status,paymentProvider:row.payment_provider,createdAt:row.created_at,updatedAt:row.updated_at,items:items.results.map(i=>({name:i.name,option:i.option_name,addons:JSON.parse(String(i.addons_json||"[]")),lineTotalCents:i.line_total_cents}))})}
    return Response.json({orders},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Orders unavailable"},{status:500})}
}

export async function POST(request:Request){
  try{
    const payload=await request.json() as {customerName?:string;items?:CartLine[]}; const customerName=payload.customerName?.trim();
    if(!customerName||!payload.items?.length)return Response.json({error:"Name and at least one item are required"},{status:400});
    const menu=await getMenu(); const lines=[]; let subtotalCents=0;
    for(const requested of payload.items){const item=menu.items.find(i=>i.id===requested.itemId&&i.available&&i.showOnKiosk);if(!item)return Response.json({error:"An item is no longer available. Please review the order."},{status:409});const addons=menu.addons.filter(a=>requested.addonIds?.includes(a.id)&&item.allowedAddons.includes(a.id)&&a.available);const lineTotalCents=item.priceCents+addons.reduce((s,a)=>s+a.priceCents,0);subtotalCents+=lineTotalCents;lines.push({item,option:item.options.includes(requested.option||"")?requested.option||"":"",addons,lineTotalCents})}
    if(menu.settings.paymentEnabled)return Response.json({error:"Payment is not yet connected. Please ask a cafe volunteer for help."},{status:503});
    const id=`SB-${Date.now().toString().slice(-6)}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;const now=new Date().toISOString();const database=db();
    await database.batch([database.prepare("INSERT INTO orders (id,customer_name,status,subtotal_cents,tax_cents,total_cents,payment_required,payment_status,payment_provider,payment_intent_id,receipt_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,customerName,"new",subtotalCents,0,subtotalCents,0,"not_required","none","","",now,now),...lines.map(line=>database.prepare("INSERT INTO order_items (order_id,item_id,name,option_name,addons_json,line_total_cents) VALUES (?,?,?,?,?,?)").bind(id,line.item.id,line.item.name,line.option,JSON.stringify(line.addons.map(a=>({id:a.id,name:a.shortName,priceCents:a.priceCents}))),line.lineTotalCents))]);
    return Response.json({order:{id,customerName,totalCents:subtotalCents,status:"new"}},{status:201});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Could not place order"},{status:500})}
}

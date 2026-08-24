import { db, getMenu, requireAdmin } from "../../../lib/store";

type CartLine={itemId?:string;option?:string;addonIds?:string[];quantity?:number};

export async function GET(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Staff PIN required"},{status:401});
  try{
    await getMenu();
    const database=db();
    const rows=await database.prepare("SELECT * FROM orders WHERE status IN ('new','in_progress','ready') ORDER BY created_at ASC").all<Record<string,unknown>>();
    const orders=[];
    for(const row of rows.results){const items=await database.prepare("SELECT * FROM order_items WHERE order_id=? ORDER BY id").bind(row.id).all<Record<string,unknown>>();orders.push({id:row.id,customerName:row.customer_name,status:row.status,pickupCode:row.pickup_code,subtotalCents:row.subtotal_cents,totalCents:row.total_cents,paymentRequired:Number(row.payment_required)===1,paymentStatus:row.payment_status,paymentProvider:row.payment_provider,createdAt:row.created_at,updatedAt:row.updated_at,items:items.results.map(i=>({name:i.name,option:i.option_name,addons:JSON.parse(String(i.addons_json||"[]")),quantity:Number(i.quantity||1),lineTotalCents:i.line_total_cents}))})}
    return Response.json({orders},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Orders unavailable"},{status:500})}
}

export async function POST(request:Request){
  try{
    const payload=await request.json() as {customerName?:string;items?:CartLine[]}; const customerName=payload.customerName?.trim();
    if(!customerName||!payload.items?.length)return Response.json({error:"Name and at least one item are required"},{status:400});
    const menu=await getMenu(); const lines=[]; let subtotalCents=0;
    for(const requested of payload.items){const item=menu.items.find(i=>i.id===requested.itemId&&i.available&&i.showOnKiosk);if(!item)return Response.json({error:"An item is no longer available. Please review the order."},{status:409});const quantity=Number(requested.quantity??1);if(!Number.isInteger(quantity)||quantity<1||quantity>20)return Response.json({error:"Item quantity must be between 1 and 20"},{status:400});const addons=menu.addons.filter(a=>requested.addonIds?.includes(a.id)&&item.allowedAddons.includes(a.id)&&a.available);const unitTotalCents=item.priceCents+addons.reduce((s,a)=>s+a.priceCents,0);const lineTotalCents=unitTotalCents*quantity;subtotalCents+=lineTotalCents;lines.push({item,option:item.options.includes(requested.option||"")?requested.option||"":"",addons,quantity,lineTotalCents})}
    if(menu.settings.paymentEnabled)return Response.json({error:"Payment is not yet connected. Please ask a cafe volunteer for help."},{status:503});
    const id=`SB-${Date.now().toString().slice(-6)}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;const now=new Date().toISOString();const database=db();const trackingToken=crypto.randomUUID();let pickupCode="";
    for(let attempt=0;attempt<8;attempt++){const candidate=String(1000+Math.floor(Math.random()*9000));const existing=await database.prepare("SELECT id FROM orders WHERE pickup_code=? AND status IN ('new','in_progress','ready') LIMIT 1").bind(candidate).first();if(!existing){pickupCode=candidate;break}}
    if(!pickupCode)pickupCode=String(100000+Math.floor(Math.random()*900000));
    await database.batch([database.prepare("INSERT INTO orders (id,customer_name,status,subtotal_cents,tax_cents,total_cents,payment_required,payment_status,payment_provider,payment_intent_id,receipt_url,pickup_code,tracking_token,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,customerName,"new",subtotalCents,0,subtotalCents,0,"not_required","none","","",pickupCode,trackingToken,now,now),...lines.map(line=>database.prepare("INSERT INTO order_items (order_id,item_id,name,option_name,addons_json,quantity,line_total_cents) VALUES (?,?,?,?,?,?,?)").bind(id,line.item.id,line.item.name,line.option,JSON.stringify(line.addons.map(a=>({id:a.id,name:a.shortName,priceCents:a.priceCents}))),line.quantity,line.lineTotalCents))]);
    return Response.json({order:{id,customerName,totalCents:subtotalCents,status:"new",pickupCode,trackingToken}},{status:201});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Could not place order"},{status:500})}
}

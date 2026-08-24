import { db, getMenu, requireAdmin } from "../../../../lib/store";

function csvCell(value:unknown){
  const text=String(value??"");
  return /[",\n\r]/.test(text)?`"${text.replaceAll('"','""')}"`:text;
}

function csv(headers:string[],rows:unknown[][]){
  return [headers,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n");
}

function statusLabel(value:unknown){
  return String(value||"").split("_").map(word=>word?word[0].toUpperCase()+word.slice(1):"").join(" ");
}

export async function GET(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Incorrect admin PIN"},{status:401});
  try{
    await getMenu();
    const database=db();
    const kind=new URL(request.url).searchParams.get("format")==="items"?"items":"orders";
    if(kind==="items"){
      const result=await database.prepare("SELECT o.id AS order_id,o.created_at,o.customer_name,oi.name,oi.option_name,oi.addons_json,oi.line_total_cents FROM order_items oi JOIN orders o ON o.id=oi.order_id ORDER BY o.created_at DESC,oi.id ASC").all<Record<string,unknown>>();
      const rows=result.results.map(row=>{let addons="";try{addons=(JSON.parse(String(row.addons_json||"[]")) as {name?:string}[]).map(addon=>addon.name).filter(Boolean).join(" • ")}catch{}const timestamp=String(row.created_at||"");return [row.order_id,timestamp.slice(0,10),row.customer_name,row.name,row.option_name,addons,1,Number(row.line_total_cents||0)/100]});
      return new Response(csv(["Order ID","Order Date","Customer Name","Item","Option","Add-ons","Quantity","Line Total"],rows),{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=\"she-brews-order-items.csv\"","cache-control":"no-store"}});
    }
    const result=await database.prepare("SELECT o.*,COUNT(oi.id) AS item_count FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC").all<Record<string,unknown>>();
    const rows=result.results.map(row=>{const timestamp=String(row.created_at||"");return [row.id,timestamp.slice(0,10),timestamp.slice(11,16),row.customer_name,row.pickup_code,statusLabel(row.status),row.item_count,Number(row.subtotal_cents||0)/100,Number(row.tax_cents||0)/100,Number(row.total_cents||0)/100,statusLabel(row.payment_status),statusLabel(row.payment_provider),"Kiosk",""]});
    return new Response(csv(["Order ID","Order Date","Order Time","Customer Name","Pickup Code","Status","Item Count","Subtotal","Tax","Total","Payment Status","Payment Provider","Source","Notes"],rows),{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=\"she-brews-orders.csv\"","cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Could not export orders"},{status:500})}
}

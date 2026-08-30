import { db, getMenu } from "./store";

export type LedgerFormat="orders"|"items";

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

const pacificDateFormatter=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",month:"2-digit",day:"2-digit",year:"numeric"});
const pacificTimeFormatter=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit",hour12:true});

function pacificTimestamp(value:unknown){
  const date=new Date(String(value||""));
  if(Number.isNaN(date.getTime()))return {date:"",time:""};
  return {date:pacificDateFormatter.format(date),time:pacificTimeFormatter.format(date)};
}

export async function buildLedgerCsv(kind:LedgerFormat){
  await getMenu();
  const database=db();
  if(kind==="items"){
    const result=await database.prepare("SELECT o.id AS order_id,o.created_at,o.customer_name,oi.name,oi.option_name,oi.addons_json,oi.quantity,oi.line_total_cents FROM order_items oi JOIN orders o ON o.id=oi.order_id ORDER BY o.created_at DESC,oi.id ASC").all<Record<string,unknown>>();
    const rows=result.results.map(row=>{let addons="";try{addons=(JSON.parse(String(row.addons_json||"[]")) as {name?:string;quantity?:number}[]).map(addon=>addon.name?(addon.quantity&&addon.quantity>1?`${addon.quantity}× ${addon.name}`:addon.name):"").filter(Boolean).join(" • ")}catch{}const timestamp=pacificTimestamp(row.created_at);return [row.order_id,timestamp.date,row.customer_name,row.name,row.option_name,addons,Number(row.quantity||1),Number(row.line_total_cents||0)/100]});
    return {content:csv(["Order ID","Order Date","Customer Name","Item","Option","Add-ons","Quantity","Line Total"],rows),filename:"old-path-cafe-order-items.csv"};
  }
  const result=await database.prepare("SELECT o.*,COALESCE(SUM(oi.quantity),0) AS item_count FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC").all<Record<string,unknown>>();
  const rows=result.results.map(row=>{const timestamp=pacificTimestamp(row.created_at);return [row.id,timestamp.date,timestamp.time,row.customer_name,row.pickup_code,statusLabel(row.status),row.item_count,Number(row.subtotal_cents||0)/100,Number(row.tax_cents||0)/100,Number(row.total_cents||0)/100,statusLabel(row.payment_status),statusLabel(row.payment_provider),"Kiosk",""]});
  return {content:csv(["Order ID","Order Date","Order Time (Pacific)","Customer Name","Pickup Code","Status","Item Count","Subtotal","Tax","Total","Payment Status","Payment Provider","Source","Notes"],rows),filename:"old-path-cafe-orders.csv"};
}

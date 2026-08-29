import { db, getMenu, requireAdmin } from "../../../../lib/store";

type InventoryPatch={kind?:"item"|"addon";id?:string;stockOnHand?:number;trackInventory?:boolean;available?:boolean;priceCents?:number;lowStockThreshold?:number;statusLabel?:string};

const allowedStatusLabels=["","Limited Edition","New","Featured","Seasonal"];

export async function PATCH(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Incorrect administrator PIN"},{status:401});
  try{
    const payload=await request.json() as InventoryPatch;
    if(!payload.kind||!payload.id)return Response.json({error:"Inventory type and id are required"},{status:400});
    const menu=await getMenu();
    const current=payload.kind==="item"?menu.items.find(entry=>entry.id===payload.id):menu.addons.find(entry=>entry.id===payload.id);
    if(!current)return Response.json({error:"Inventory entry not found"},{status:404});
    const stockOnHand=payload.stockOnHand??current.stockOnHand;
    const priceCents=payload.priceCents??current.priceCents;
    const lowStockThreshold=payload.lowStockThreshold??current.lowStockThreshold;
    if(!Number.isInteger(stockOnHand)||stockOnHand<0||stockOnHand>100000)return Response.json({error:"Stock must be a whole number from 0 to 100,000"},{status:400});
    if(!Number.isInteger(priceCents)||priceCents<0||priceCents>100000)return Response.json({error:"Price is invalid"},{status:400});
    if(!Number.isInteger(lowStockThreshold)||lowStockThreshold<0||lowStockThreshold>100000)return Response.json({error:"Low-stock threshold is invalid"},{status:400});
    if(payload.kind==="item"){
      const statusLabel=payload.statusLabel??("statusLabel" in current?String(current.statusLabel):"");
      if(!allowedStatusLabels.includes(statusLabel))return Response.json({error:"Choose a valid menu label"},{status:400});
      await db().prepare("UPDATE menu_items SET stock_on_hand=?,track_inventory=?,available=?,price_cents=?,low_stock_threshold=?,status_label=?,updated_at=? WHERE id=?").bind(stockOnHand,(payload.trackInventory??current.trackInventory)?1:0,(payload.available??current.manualAvailable)?1:0,priceCents,lowStockThreshold,statusLabel,new Date().toISOString(),payload.id).run();
    }else{
      await db().prepare("UPDATE addons SET stock_on_hand=?,track_inventory=?,available=?,price_cents=?,low_stock_threshold=?,updated_at=? WHERE id=?").bind(stockOnHand,(payload.trackInventory??current.trackInventory)?1:0,(payload.available??current.manualAvailable)?1:0,priceCents,lowStockThreshold,new Date().toISOString(),payload.id).run();
    }
    return Response.json({ok:true});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Inventory update failed"},{status:500})}
}

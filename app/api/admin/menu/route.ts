import { db, getMenu, parseCsv, requireAdmin, setSetting, syncAddons, syncItems } from "../../../../lib/store";

export async function PATCH(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Incorrect admin PIN"},{status:401});
  try{const payload=await request.json() as {id?:string;available?:boolean;statusLabel?:string};if(!payload.id)return Response.json({error:"Item id required"},{status:400});const current=(await getMenu()).items.find(i=>i.id===payload.id);if(!current)return Response.json({error:"Item not found"},{status:404});await db().prepare("UPDATE menu_items SET available=?,status_label=?,updated_at=? WHERE id=?").bind(payload.available??current.available?1:0,payload.statusLabel??current.statusLabel,new Date().toISOString(),payload.id).run();return Response.json({ok:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Update failed"},{status:500})}
}

export async function POST(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Incorrect admin PIN"},{status:401});
  try{const payload=await request.json() as {itemSheetUrl?:string;addonSheetUrl?:string};let itemCount=0,addonCount=0;if(payload.itemSheetUrl){const response=await fetch(payload.itemSheetUrl);if(!response.ok)throw new Error("Could not read the menu sheet");itemCount=await syncItems(parseCsv(await response.text()));await setSetting("itemSheetUrl",payload.itemSheetUrl)}if(payload.addonSheetUrl){const response=await fetch(payload.addonSheetUrl);if(!response.ok)throw new Error("Could not read the add-ons sheet");addonCount=await syncAddons(parseCsv(await response.text()));await setSetting("addonSheetUrl",payload.addonSheetUrl)}return Response.json({ok:true,itemCount,addonCount})}catch(error){return Response.json({error:error instanceof Error?error.message:"Sheet sync failed"},{status:500})}
}

import { db, getMenu } from "../../../lib/store";

export async function GET(){
  try{
    await getMenu();
    const rows=await db().prepare("SELECT pickup_code,updated_at FROM orders WHERE status='ready' ORDER BY updated_at ASC LIMIT 12").all<Record<string,unknown>>();
    return Response.json({orders:rows.results.map(row=>({pickupCode:row.pickup_code,readyAt:row.updated_at}))},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Pickup board unavailable"},{status:500})}
}

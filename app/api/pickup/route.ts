import { db, getMenu } from "../../../lib/store";

export async function GET(){
  try{
    await getMenu();
    const rows=await db().prepare("SELECT pickup_code,status,updated_at FROM orders WHERE status IN ('new','in_progress','ready') AND pickup_code IS NOT NULL ORDER BY created_at ASC LIMIT 18").all<Record<string,unknown>>();
    return Response.json({orders:rows.results.map(row=>({pickupCode:row.pickup_code,status:row.status,updatedAt:row.updated_at}))},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Pickup board unavailable"},{status:500})}
}

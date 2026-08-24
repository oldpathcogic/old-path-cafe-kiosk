import { db, getMenu } from "../../../lib/store";

export async function GET(request:Request){
  try{
    await getMenu();
    const {searchParams}=new URL(request.url);
    const token=searchParams.get("token")?.trim();
    const code=searchParams.get("code")?.trim();
    if(!token&&!/^\d{4,6}$/.test(code||""))return Response.json({error:"Enter a valid pickup code"},{status:400});
    const database=db();
    const row=token
      ?await database.prepare("SELECT status,pickup_code,created_at,updated_at FROM orders WHERE tracking_token=? LIMIT 1").bind(token).first<Record<string,unknown>>()
      :await database.prepare("SELECT status,pickup_code,created_at,updated_at FROM orders WHERE pickup_code=? ORDER BY created_at DESC LIMIT 1").bind(code).first<Record<string,unknown>>();
    if(!row)return Response.json({error:"We could not find that order"},{status:404});
    return Response.json({order:{status:row.status,pickupCode:row.pickup_code,createdAt:row.created_at,updatedAt:row.updated_at}},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Order status unavailable"},{status:500})}
}

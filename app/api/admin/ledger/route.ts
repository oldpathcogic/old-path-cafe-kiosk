import { getSetting, requireAdmin } from "../../../../lib/store";

export async function GET(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Incorrect admin PIN"},{status:401});
  try{
    const url=await getSetting("ordersLedgerUrl");
    if(!url)return Response.json({error:"Orders ledger is not configured"},{status:404});
    return Response.json({url},{headers:{"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Orders ledger unavailable"},{status:500})}
}

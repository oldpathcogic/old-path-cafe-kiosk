import { requireAdmin } from "../../../../lib/store";

export async function POST(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Incorrect administrator PIN"},{status:401});
  return Response.json({ok:true});
}

import { requireStaff } from "../../../../lib/store";

export async function POST(request:Request){
  if(!requireStaff(request))return Response.json({error:"Incorrect staff PIN"},{status:401});
  return Response.json({ok:true});
}

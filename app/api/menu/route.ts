import { getMenu } from "../../../lib/store";

export async function GET(){
  try{return Response.json(await getMenu(),{headers:{"cache-control":"no-store"}})}catch(error){return Response.json({error:error instanceof Error?error.message:"Menu unavailable"},{status:500})}
}

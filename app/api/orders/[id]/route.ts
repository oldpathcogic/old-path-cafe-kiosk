import { db, requireAdmin } from "../../../../lib/store";

const allowed=new Set(["new","in_progress","ready","completed","canceled"]);
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
  if(!requireAdmin(request))return Response.json({error:"Staff PIN required"},{status:401});
  try{const {id}=await context.params;const payload=await request.json() as {status?:string};if(!payload.status||!allowed.has(payload.status))return Response.json({error:"Invalid status"},{status:400});await db().prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(payload.status,new Date().toISOString(),id).run();return Response.json({ok:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not update order"},{status:500})}
}

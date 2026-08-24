import { buildLedgerCsv } from "../../../../lib/ledger";
import { requireAdmin } from "../../../../lib/store";

export async function GET(request:Request){
  if(!requireAdmin(request))return Response.json({error:"Incorrect admin PIN"},{status:401});
  try{
    const kind=new URL(request.url).searchParams.get("format")==="items"?"items":"orders";
    const ledger=await buildLedgerCsv(kind);
    return new Response(ledger.content,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="${ledger.filename}"`,"cache-control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Could not export orders"},{status:500})}
}

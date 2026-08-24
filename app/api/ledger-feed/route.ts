import { env } from "cloudflare:workers";
import { buildLedgerCsv } from "../../../lib/ledger";

export async function GET(request:Request){
  const url=new URL(request.url);
  const expected=(env as unknown as {LEDGER_FEED_TOKEN?:string}).LEDGER_FEED_TOKEN;
  if(!expected||url.searchParams.get("token")!==expected)return new Response("Ledger feed unavailable",{status:403,headers:{"cache-control":"no-store"}});
  try{
    const kind=url.searchParams.get("format")==="items"?"items":"orders";
    const ledger=await buildLedgerCsv(kind);
    return new Response(ledger.content,{headers:{"content-type":"text/csv; charset=utf-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"}});
  }catch(error){return new Response(error instanceof Error?error.message:"Ledger feed unavailable",{status:500,headers:{"cache-control":"no-store"}})}
}

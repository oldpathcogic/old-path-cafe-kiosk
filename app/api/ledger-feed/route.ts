import { env } from "cloudflare:workers";
import { buildLedgerCsv } from "../../../lib/ledger";

const noCacheHeaders={
  "cache-control":"no-store, no-cache, must-revalidate, max-age=0",
  "pragma":"no-cache",
  "expires":"0",
};

export async function GET(request:Request){
  const url=new URL(request.url);
  const expected=(env as unknown as {LEDGER_FEED_TOKEN?:string}).LEDGER_FEED_TOKEN;
  if(!expected||url.searchParams.get("token")!==expected)return new Response("Ledger feed unavailable",{status:403,headers:noCacheHeaders});
  try{
    const kind=url.searchParams.get("format")==="items"?"items":"orders";
    const ledger=await buildLedgerCsv(kind);
    return new Response(ledger.content,{headers:{...noCacheHeaders,"content-type":"text/csv; charset=utf-8","x-content-type-options":"nosniff"}});
  }catch(error){return new Response(error instanceof Error?error.message:"Ledger feed unavailable",{status:500,headers:noCacheHeaders})}
}

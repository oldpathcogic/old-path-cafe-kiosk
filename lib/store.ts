import { env } from "cloudflare:workers";

export type MenuItem = { id:string; name:string; category:string; description:string; priceCents:number; available:boolean; statusLabel:string; featured:boolean; displayOrder:number; allowedAddons:string[]; options:string[]; showOnKiosk:boolean; showOnMenuBoard:boolean };
export type Addon = { id:string; name:string; shortName:string; category:string; priceCents:number; available:boolean; displayOrder:number };
export type CafeSettings = { cafeName:string; subtitle:string; footer:string; paymentEnabled:boolean; paymentProvider:string; itemSheetUrl:string; addonSheetUrl:string };

const seedItems:MenuItem[] = [
  {id:"regular-coffee",name:"Regular Coffee",category:"Coffee",description:"Classic drip coffee, hot and fresh",priceCents:400,available:true,statusLabel:"",featured:false,displayOrder:1,allowedAddons:["vanilla","caramel","hazelnut","mocha","oat-milk","almond-milk"],options:["Regular","Decaf"],showOnKiosk:true,showOnMenuBoard:true},
  {id:"cold-brew",name:"Cold Brew",category:"Coffee",description:"Smooth, bold, and refreshing",priceCents:600,available:true,statusLabel:"Limited Edition",featured:true,displayOrder:2,allowedAddons:["vanilla","caramel","hazelnut","mocha","oat-milk","almond-milk"],options:[],showOnKiosk:true,showOnMenuBoard:true},
  {id:"latte",name:"Latte",category:"Coffee",description:"Hot or iced, creamy and rich",priceCents:600,available:true,statusLabel:"",featured:false,displayOrder:3,allowedAddons:["vanilla","caramel","hazelnut","mocha","oat-milk","almond-milk","extra-shot","whipped-cream","decaf-espresso"],options:["Hot","Iced"],showOnKiosk:true,showOnMenuBoard:true},
  {id:"cappuccino",name:"Cappuccino",category:"Coffee",description:"Foamy, smooth, and full of flavor",priceCents:600,available:true,statusLabel:"",featured:false,displayOrder:4,allowedAddons:["vanilla","caramel","hazelnut","mocha","oat-milk","almond-milk","extra-shot","decaf-espresso"],options:[],showOnKiosk:true,showOnMenuBoard:true},
  {id:"espresso-shot",name:"Espresso Shot",category:"Coffee",description:"Strong and rich",priceCents:250,available:true,statusLabel:"",featured:false,displayOrder:5,allowedAddons:["decaf-espresso"],options:[],showOnKiosk:true,showOnMenuBoard:true},
  {id:"donut",name:"Donut",category:"Pastries",description:"Sweet pastry",priceCents:200,available:true,statusLabel:"",featured:false,displayOrder:6,allowedAddons:[],options:[],showOnKiosk:true,showOnMenuBoard:true},
  {id:"croissant",name:"Croissant",category:"Pastries",description:"Buttery, flaky pastry",priceCents:200,available:true,statusLabel:"",featured:false,displayOrder:7,allowedAddons:[],options:[],showOnKiosk:true,showOnMenuBoard:true},
];
const seedAddons:Addon[] = [
  {id:"vanilla",name:"Vanilla Syrup",shortName:"Vanilla",category:"Flavor",priceCents:75,available:true,displayOrder:1},{id:"caramel",name:"Caramel Syrup",shortName:"Caramel",category:"Flavor",priceCents:75,available:true,displayOrder:2},{id:"hazelnut",name:"Hazelnut Syrup",shortName:"Hazelnut",category:"Flavor",priceCents:75,available:true,displayOrder:3},{id:"mocha",name:"Mocha Syrup",shortName:"Mocha",category:"Flavor",priceCents:75,available:true,displayOrder:4},{id:"oat-milk",name:"Oat Milk",shortName:"Oat Milk",category:"Milk",priceCents:75,available:true,displayOrder:5},{id:"almond-milk",name:"Almond Milk",shortName:"Almond Milk",category:"Milk",priceCents:75,available:true,displayOrder:6},{id:"whipped-cream",name:"Whipped Cream",shortName:"Whip",category:"Topping",priceCents:75,available:true,displayOrder:7},{id:"extra-shot",name:"Extra Espresso Shot",shortName:"Extra Shot",category:"Coffee",priceCents:100,available:true,displayOrder:8},{id:"decaf-espresso",name:"Decaf Espresso Option",shortName:"Decaf",category:"Coffee",priceCents:50,available:true,displayOrder:9},
];
const settingDefaults:Record<string,string> = {cafeName:"She Brews",subtitle:"Coffee. Connection. Community.",footer:"All proceeds support the ministry",paymentEnabled:"false",paymentProvider:"none",itemSheetUrl:"",addonSheetUrl:""};

function db(){ if(!env.DB) throw new Error("Cafe database is unavailable"); return env.DB; }
function bool(value:unknown){ return Number(value) === 1 || value === true; }
function list(value:unknown){ try{return JSON.parse(String(value||"[]")) as string[]}catch{return []} }
let schemaReady:Promise<void>|null=null;
function ensureSchema(){
  if(schemaReady)return schemaReady;
  const database=db();
  schemaReady=database.batch([
    database.prepare("CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',price_cents INTEGER NOT NULL,available INTEGER NOT NULL DEFAULT 1,status_label TEXT NOT NULL DEFAULT '',featured INTEGER NOT NULL DEFAULT 0,display_order INTEGER NOT NULL DEFAULT 0,allowed_addons TEXT NOT NULL DEFAULT '[]',options TEXT NOT NULL DEFAULT '[]',show_on_kiosk INTEGER NOT NULL DEFAULT 1,show_on_menu_board INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS addons (id TEXT PRIMARY KEY NOT NULL,name TEXT NOT NULL,short_name TEXT NOT NULL,category TEXT NOT NULL,price_cents INTEGER NOT NULL,available INTEGER NOT NULL DEFAULT 1,display_order INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY NOT NULL,customer_name TEXT NOT NULL,status TEXT NOT NULL,subtotal_cents INTEGER NOT NULL,tax_cents INTEGER NOT NULL DEFAULT 0,total_cents INTEGER NOT NULL,payment_required INTEGER NOT NULL DEFAULT 0,payment_status TEXT NOT NULL DEFAULT 'not_required',payment_provider TEXT NOT NULL DEFAULT 'none',payment_intent_id TEXT NOT NULL DEFAULT '',receipt_url TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,order_id TEXT NOT NULL,item_id TEXT NOT NULL,name TEXT NOT NULL,option_name TEXT NOT NULL DEFAULT '',addons_json TEXT NOT NULL DEFAULT '[]',line_total_cents INTEGER NOT NULL)"),
    database.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL,value TEXT NOT NULL,updated_at TEXT NOT NULL)"),
    database.prepare("CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders(status,created_at)"),
    database.prepare("CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id)"),
  ]).then(()=>undefined).catch(error=>{schemaReady=null;throw error});
  return schemaReady;
}

export async function seedDatabase(){
  await ensureSchema(); const database=db(); const count=await database.prepare("SELECT COUNT(*) AS count FROM menu_items").first<{count:number}>();
  if(Number(count?.count||0)===0){
    await database.batch(seedItems.map(i=>database.prepare("INSERT OR IGNORE INTO menu_items (id,name,category,description,price_cents,available,status_label,featured,display_order,allowed_addons,options,show_on_kiosk,show_on_menu_board,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(i.id,i.name,i.category,i.description,i.priceCents,i.available?1:0,i.statusLabel,i.featured?1:0,i.displayOrder,JSON.stringify(i.allowedAddons),JSON.stringify(i.options),i.showOnKiosk?1:0,i.showOnMenuBoard?1:0,new Date().toISOString())));
  }
  const addCount=await database.prepare("SELECT COUNT(*) AS count FROM addons").first<{count:number}>();
  if(Number(addCount?.count||0)===0){await database.batch(seedAddons.map(a=>database.prepare("INSERT OR IGNORE INTO addons (id,name,short_name,category,price_cents,available,display_order,updated_at) VALUES (?,?,?,?,?,?,?,?)").bind(a.id,a.name,a.shortName,a.category,a.priceCents,a.available?1:0,a.displayOrder,new Date().toISOString())))}
  await database.batch(Object.entries(settingDefaults).map(([key,value])=>database.prepare("INSERT OR IGNORE INTO settings (key,value,updated_at) VALUES (?,?,?)").bind(key,value,new Date().toISOString())));
}

export async function getMenu(){
  await seedDatabase(); const database=db();
  const itemRows=await database.prepare("SELECT * FROM menu_items ORDER BY display_order,name").all<Record<string,unknown>>();
  const addonRows=await database.prepare("SELECT * FROM addons ORDER BY display_order,name").all<Record<string,unknown>>();
  const settingRows=await database.prepare("SELECT key,value FROM settings").all<{key:string;value:string}>();
  const settings={...settingDefaults,...Object.fromEntries(settingRows.results.map(r=>[r.key,r.value]))};
  return {
    items:itemRows.results.map(r=>({id:String(r.id),name:String(r.name),category:String(r.category),description:String(r.description),priceCents:Number(r.price_cents),available:bool(r.available),statusLabel:String(r.status_label||""),featured:bool(r.featured),displayOrder:Number(r.display_order),allowedAddons:list(r.allowed_addons),options:list(r.options),showOnKiosk:bool(r.show_on_kiosk),showOnMenuBoard:bool(r.show_on_menu_board)})),
    addons:addonRows.results.map(r=>({id:String(r.id),name:String(r.name),shortName:String(r.short_name),category:String(r.category),priceCents:Number(r.price_cents),available:bool(r.available),displayOrder:Number(r.display_order)})),
    settings:{cafeName:settings.cafeName,subtitle:settings.subtitle,footer:settings.footer,paymentEnabled:settings.paymentEnabled==="true",paymentProvider:settings.paymentProvider,itemSheetUrl:settings.itemSheetUrl,addonSheetUrl:settings.addonSheetUrl} as CafeSettings,
    updatedAt:new Date().toISOString(),
  };
}

export function requireAdmin(request:Request){
  const pin=(env as unknown as {ADMIN_PIN?:string}).ADMIN_PIN;
  if(!pin) return false;
  return request.headers.get("x-admin-pin")===pin;
}

export async function setSetting(key:string,value:string){await db().prepare("INSERT INTO settings (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(key,value,new Date().toISOString()).run()}
export function parseCsv(text:string){
  const rows:string[][]=[]; let row:string[]=[]; let cell=""; let quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i]; if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++}else if(c==='"'){quoted=!quoted}else if(c===','&&!quoted){row.push(cell.trim());cell=""}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=""}else cell+=c}
  if(cell||row.length){row.push(cell.trim());rows.push(row)} if(rows.length<2)return[]; const headers=rows[0].map(h=>h.trim().toLowerCase()); return rows.slice(1).map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??""])));
}
export async function syncItems(records:Record<string,string>[]){const database=db();const now=new Date().toISOString();let count=0;for(const r of records){const id=r.item_id?.trim();if(!id||!r.name)continue;await database.prepare("INSERT INTO menu_items (id,name,category,description,price_cents,available,status_label,featured,display_order,allowed_addons,options,show_on_kiosk,show_on_menu_board,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,description=excluded.description,price_cents=excluded.price_cents,available=excluded.available,status_label=excluded.status_label,featured=excluded.featured,display_order=excluded.display_order,allowed_addons=excluded.allowed_addons,options=excluded.options,show_on_kiosk=excluded.show_on_kiosk,show_on_menu_board=excluded.show_on_menu_board,updated_at=excluded.updated_at").bind(id,r.name,r.category||"Coffee",r.description||"",Math.round(Number(r.price||0)*100),!/^false|no|0$/i.test(r.available),r.status_label||"",/^true|yes|1$/i.test(r.featured),Number(r.display_order||0),JSON.stringify((r.allowed_addons||"").split(",").map(x=>x.trim()).filter(Boolean)),JSON.stringify((r.options||"").split(",").map(x=>x.trim()).filter(Boolean)),!/^false|no|0$/i.test(r.show_on_kiosk),!/^false|no|0$/i.test(r.show_on_menu_board),now).run();count++}return count}
export async function syncAddons(records:Record<string,string>[]){const database=db();const now=new Date().toISOString();let count=0;for(const r of records){const id=r.addon_id?.trim();if(!id||!r.name)continue;await database.prepare("INSERT INTO addons (id,name,short_name,category,price_cents,available,display_order,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,short_name=excluded.short_name,category=excluded.category,price_cents=excluded.price_cents,available=excluded.available,display_order=excluded.display_order,updated_at=excluded.updated_at").bind(id,r.name,r.short_name||r.name,r.category||"Add-on",Math.round(Number(r.price||0)*100),!/^false|no|0$/i.test(r.available),Number(r.display_order||0),now).run();count++}return count}
export { db };

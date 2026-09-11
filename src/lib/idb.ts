'use client';
import type { RoomSnapshot, SyncMutation } from './types';
const DB='common-room-v3',VERSION=1,SNAPSHOT_KEY='room-snapshot';
function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv');if(!db.objectStoreNames.contains('outbox'))db.createObjectStore('outbox',{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function tx<T>(storeName:'kv'|'outbox',mode:IDBTransactionMode,fn:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await openDb();return new Promise((resolve,reject)=>{const tr=db.transaction(storeName,mode),req=fn(tr.objectStore(storeName));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tr.oncomplete=()=>db.close()})}
export async function readSnapshot():Promise<RoomSnapshot|null>{try{return(await tx('kv','readonly',s=>s.get(SNAPSHOT_KEY)))||null}catch{return null}}
export async function writeSnapshot(snapshot:RoomSnapshot){try{await tx('kv','readwrite',s=>s.put(snapshot,SNAPSHOT_KEY))}catch{}}
export async function addOutbox(m:SyncMutation){await tx('outbox','readwrite',s=>s.put(m))}
export async function listOutbox():Promise<SyncMutation[]>{try{return(await tx('outbox','readonly',s=>s.getAll()))||[]}catch{return[]}}
export async function removeOutbox(id:string){try{await tx('outbox','readwrite',s=>s.delete(id))}catch{}}
export async function clearLocalDb(){try{const db=await openDb();db.close();indexedDB.deleteDatabase(DB)}catch{}}

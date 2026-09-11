'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const FALLBACK_URL='https://dhpejtbsmhlolgnbmnvj.supabase.co';
const FALLBACK_KEY='sb_publishable_A8BHGyelZm4votZVJ8e8QA_1D5T956y';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||FALLBACK_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||FALLBACK_KEY;
let baseClient:SupabaseClient|null=null;
export function getBaseSupabase(){if(!baseClient)baseClient=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});return baseClient}
export function getMemberSupabase(memberToken:string){return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{'x-member-token':memberToken}}})}

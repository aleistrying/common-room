import CommonRoomApp from '@/components/CommonRoomApp';
export default async function Shared({params}:{params:Promise<{token:string}>}){const{token}=await params;return <CommonRoomApp shareToken={token}/>}

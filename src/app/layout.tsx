import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Common Room',description:'Shared ideas, plans, polls and availability for the room.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={themeColor:'#FAFAF8',width:'device-width',initialScale:1,viewportFit:'cover'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

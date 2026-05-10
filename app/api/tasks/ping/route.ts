import { NextRequest, NextResponse } from 'next/server'
import { appendActivity } from '../../_data'
export async function POST(req: NextRequest) { const { taskId, message }=await req.json(); appendActivity({agent:'operator',event:`Ping for ${taskId}: ${message || 'no message'}`,type:'task_ping'}); return NextResponse.json({ok:true, delivered:false, note:'Public demo logs pings locally instead of sending them to agents.'}) }

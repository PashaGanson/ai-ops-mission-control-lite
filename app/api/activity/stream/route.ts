import { NextResponse } from 'next/server'
import { readActivity } from '../../_data'
export async function GET() { const body = readActivity().slice(-20).map((e)=>`data: ${JSON.stringify(e)}\n\n`).join(''); return new NextResponse(body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }) }

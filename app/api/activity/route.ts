import { NextRequest, NextResponse } from 'next/server'
import { appendActivity, readActivity } from '../_data'
export async function GET() { return NextResponse.json(readActivity().slice(-100).reverse()) }
export async function POST(req: NextRequest) { const body=await req.json(); appendActivity({agent:body.agent||'system', event:body.action||body.event||'activity', type:body.type||'manual'}); return NextResponse.json({ok:true}) }

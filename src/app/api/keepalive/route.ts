import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Evita que Next.js/Vercel cachee la respuesta: cada llamada debe tocar la base de datos.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Ruta llamada a diario por el cron de Vercel (ver vercel.json) para que
// Supabase registre actividad y no pause el proyecto del plan gratuito.
export async function GET() {
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .limit(1)

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, at: new Date().toISOString() },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    rows: data?.length ?? 0,
    at: new Date().toISOString(),
  })
}

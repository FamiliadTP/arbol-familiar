import { Member } from './supabase'

export function fullName(p: Member): string {
  return [p.name, p.surname1, p.surname2].filter(Boolean).join(' ')
}

export function calcAge(born: string, died: string | null): number {
  const end = died ? new Date(died) : new Date()
  const start = new Date(born)
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

export function fmtDate(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

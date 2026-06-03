import { Member } from './supabase'

export function fullName(p: Member): string {
  return [p.name, p.surname1, p.surname2].filter(Boolean).join(' ')
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function calcAge(born: string, died: string | null): number {
  const end = died ? parseLocalDate(died) : new Date()
  const start = parseLocalDate(born)
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

export function fmtDate(date: string | null): string {
  if (!date) return '—'
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

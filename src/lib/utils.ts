import { Member } from './supabase'

export const fullName = (p: Member) => `${p.name} ${p.surname1} ${p.surname2}`

export const calcAge = (born: string, died: string | null) => {
  const end = died ? new Date(died) : new Date()
  const start = new Date(born)
  return Math.floor((end.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000))
}

export const fmtDate = (d: string | null) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

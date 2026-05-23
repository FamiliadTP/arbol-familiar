import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Gender = 'M' | 'F'

export interface Member {
  id: string
  name: string
  surname1: string
  surname2: string
  born: string
  died: string | null
  gender: Gender
  generation: number
  spouse_id: string | null
  children_ids: string[]
  external: boolean
  email: string | null
  bio_birthplace: string | null
  bio_education: string | null
  bio_occupation: string | null
  bio_notes: string | null
  created_at?: string
}

export interface PendingEdit {
  id: string
  member_id: string
  proposed_by: string
  changes: Partial<Member>
  note: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

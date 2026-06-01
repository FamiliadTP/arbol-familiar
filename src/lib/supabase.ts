import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yzhivwkcbfmirkitxuwt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aGl2d2tjYmZtaXJraXR4dXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTc0NzEsImV4cCI6MjA5NTAzMzQ3MX0.iwSvLt19HOJy25RrBgUncpS0-mWtMQFoqRkOhFIF40M'

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

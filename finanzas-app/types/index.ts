export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          user_id: string  // Ya guardado en BD
          description: string
          amount: number
          type: 'income' | 'expense'
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string  // ⚠️ DEBE SER OPCIONAL para que Supabase lo llene automáticamente
          description: string
          amount: number
          type: 'income' | 'expense'
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          type?: 'income' | 'expense'
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionType = 'income' | 'expense'

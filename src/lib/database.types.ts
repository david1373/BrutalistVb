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
      articles: {
        Row: {
          id: string
          source_id: string
          title: string
          rewritten_content: string | null
          url: string
          image_url: string | null
          author: string | null
          published_at: string | null
          created_at: string
          is_subscriber_only: boolean
          category: string | null
          original_content: string
          is_processed: boolean
        }
        Insert: {
          id?: string
          source_id: string
          title: string
          rewritten_content?: string | null
          url: string
          image_url?: string | null
          author?: string | null
          published_at?: string | null
          created_at?: string
          is_subscriber_only?: boolean
          category?: string | null
          original_content: string
          is_processed?: boolean
        }
        Update: {
          id?: string
          source_id?: string
          title?: string
          rewritten_content?: string | null
          url?: string
          image_url?: string | null
          author?: string | null
          published_at?: string | null
          created_at?: string
          is_subscriber_only?: boolean
          category?: string | null
          original_content?: string
          is_processed?: boolean
        }
      }
      sources: {
        Row: {
          id: string
          name: string
          url: string
          enabled: boolean
          last_scraped_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          enabled?: boolean
          last_scraped_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          enabled?: boolean
          last_scraped_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
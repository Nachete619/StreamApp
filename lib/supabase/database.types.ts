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
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          cover_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          cover_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          cover_url?: string | null
          bio?: string | null
          created_at?: string
        }
      }
      streams: {
        Row: {
          id: string
          user_id: string
          title: string
          stream_key: string
          ingest_url: string
          playback_id: string
          is_live: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          stream_key: string
          ingest_url: string
          playback_id: string
          is_live?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          stream_key?: string
          ingest_url?: string
          playback_id?: string
          is_live?: boolean
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          stream_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stream_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stream_id?: string
          content?: string
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          stream_id: string
          user_id: string
          playback_url: string
          duration: number | null
          created_at: string
        }
        Insert: {
          id?: string
          stream_id: string
          user_id: string
          playback_url: string
          duration?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          stream_id?: string
          user_id?: string
          playback_url?: string
          duration?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

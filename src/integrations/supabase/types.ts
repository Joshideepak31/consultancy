export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit: {
        Row: {
          action: string | null
          actor: string | null
          at: string
          details: string | null
          entity: string | null
          entity_name: string | null
          id: string
        }
        Insert: {
          action?: string | null
          actor?: string | null
          at?: string
          details?: string | null
          entity?: string | null
          entity_name?: string | null
          id: string
        }
        Update: {
          action?: string | null
          actor?: string | null
          at?: string
          details?: string | null
          entity?: string | null
          entity_name?: string | null
          id?: string
        }
        Relationships: []
      }
      counselors: {
        Row: {
          active: boolean | null
          data: Json
          email: string | null
          id: string
          joined_at: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          active?: boolean | null
          data?: Json
          email?: string | null
          id: string
          joined_at?: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          active?: boolean | null
          data?: Json
          email?: string | null
          id?: string
          joined_at?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          currency: string | null
          data: Json
          flag: string | null
          id: string
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          currency?: string | null
          data?: Json
          flag?: string | null
          id: string
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          currency?: string | null
          data?: Json
          flag?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          country_id: string | null
          data: Json
          folder_id: string | null
          id: string
          kind: string | null
          program_id: string | null
          title: string
          university_id: string | null
          uploaded_at: string
          url: string | null
        }
        Insert: {
          country_id?: string | null
          data?: Json
          folder_id?: string | null
          id: string
          kind?: string | null
          program_id?: string | null
          title: string
          university_id?: string | null
          uploaded_at?: string
          url?: string | null
        }
        Update: {
          country_id?: string | null
          data?: Json
          folder_id?: string | null
          id?: string
          kind?: string | null
          program_id?: string | null
          title?: string
          university_id?: string | null
          uploaded_at?: string
          url?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          body: string | null
          category: string | null
          country_id: string | null
          data: Json
          id: string
          pinned: boolean | null
          title: string
          university_id: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          category?: string | null
          country_id?: string | null
          data?: Json
          id: string
          pinned?: boolean | null
          title: string
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          category?: string | null
          country_id?: string | null
          data?: Json
          id?: string
          pinned?: boolean | null
          title?: string
          university_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      process_maps: {
        Row: {
          country_id: string | null
          data: Json
          id: string
          status: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          data?: Json
          id: string
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          data?: Json
          id?: string
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          data: Json
          id: string
          level: string | null
          name: string
          status: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          data?: Json
          id: string
          level?: string | null
          name: string
          status?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          level?: string | null
          name?: string
          status?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          category: string | null
          data: Json
          id: string
          scope: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          data?: Json
          id: string
          scope?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          data?: Json
          id?: string
          scope?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          data: Json
          email: string | null
          full_name: string | null
          id: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          email?: string | null
          full_name?: string | null
          id: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          email?: string | null
          full_name?: string | null
          id?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      universities: {
        Row: {
          country_id: string | null
          data: Json
          id: string
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          data?: Json
          id: string
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          data?: Json
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "universities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "counselor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "counselor"],
    },
  },
} as const

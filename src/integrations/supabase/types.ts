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
      appointments: {
        Row: {
          arrived_at: string | null
          child_age: string | null
          child_name: string
          child_national_id: string | null
          completed_at: string | null
          created_at: string
          created_by_admin: boolean
          deleted_at: string | null
          duration_minutes: number
          email: string | null
          id: string
          language: Database["public"]["Enums"]["app_language"]
          location_id: string
          notes: string | null
          parent_name: string
          patient_id: string | null
          phone: string
          slot_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          therapist_id: string | null
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          child_age?: string | null
          child_name: string
          child_national_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_admin?: boolean
          deleted_at?: string | null
          duration_minutes?: number
          email?: string | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          location_id: string
          notes?: string | null
          parent_name: string
          patient_id?: string | null
          phone: string
          slot_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          therapist_id?: string | null
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          child_age?: string | null
          child_name?: string
          child_national_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_admin?: boolean
          deleted_at?: string | null
          duration_minutes?: number
          email?: string | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          location_id?: string
          notes?: string | null
          parent_name?: string
          patient_id?: string | null
          phone?: string
          slot_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          therapist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_slots: {
        Row: {
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          location_id: string
          reason: string | null
          start_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          location_id: string
          reason?: string | null
          start_at: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          location_id?: string
          reason?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_reminders: {
        Row: {
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          patient_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["reminder_status"]
          suggested_date: string
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["reminder_status"]
          suggested_date: string
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["reminder_status"]
          suggested_date?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          patient_id: string
          payment_id: string
          provider: Database["public"]["Enums"]["insurance_provider"]
          status: Database["public"]["Enums"]["insurance_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          payment_id: string
          provider?: Database["public"]["Enums"]["insurance_provider"]
          status?: Database["public"]["Enums"]["insurance_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          payment_id?: string
          provider?: Database["public"]["Enums"]["insurance_provider"]
          status?: Database["public"]["Enums"]["insurance_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          patient_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          patient_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_ar: string | null
          address_en: string | null
          address_he: string | null
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          name_he: string
          slug: string
          sort_order: number
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          address_he?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          name_he: string
          slug: string
          sort_order?: number
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          address_he?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          name_he?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      patient_files: {
        Row: {
          category: Database["public"]["Enums"]["patient_file_category"]
          created_at: string
          deleted_at: string | null
          description: string | null
          file_name: string
          id: string
          mime_type: string | null
          patient_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["patient_file_category"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          patient_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["patient_file_category"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          patient_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          is_active: boolean
          national_id: string | null
          notes: string | null
          parent_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_active?: boolean
          national_id?: string | null
          notes?: string | null
          parent_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_active?: boolean
          national_id?: string | null
          notes?: string | null
          parent_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          insurance_paid: number
          insurance_provider:
            | Database["public"]["Enums"]["insurance_provider"]
            | null
          needs_insurance_submission: boolean
          notes: string | null
          patient_id: string
          patient_paid: number
          payment_date: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          treatment_id: string | null
          treatment_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          insurance_paid?: number
          insurance_provider?:
            | Database["public"]["Enums"]["insurance_provider"]
            | null
          needs_insurance_submission?: boolean
          notes?: string | null
          patient_id: string
          patient_paid?: number
          payment_date?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          treatment_id?: string | null
          treatment_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          insurance_paid?: number
          insurance_provider?:
            | Database["public"]["Enums"]["insurance_provider"]
            | null
          needs_insurance_submission?: boolean
          notes?: string | null
          patient_id?: string
          patient_paid?: number
          payment_date?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          treatment_id?: string | null
          treatment_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      therapists: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      treatments: {
        Row: {
          activities: string | null
          additional_notes: string | null
          appointment_id: string | null
          assessment: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          follow_up_date: string | null
          follow_up_priority:
            | Database["public"]["Enums"]["priority_level"]
            | null
          goals: string | null
          home_exercises: string | null
          id: string
          next_plan: string | null
          patient_id: string
          patient_response: string | null
          progress: string | null
          recommendations: string | null
          requires_follow_up: boolean
          summary: string | null
          therapist_id: string | null
          treatment_date: string
          updated_at: string
        }
        Insert: {
          activities?: string | null
          additional_notes?: string | null
          appointment_id?: string | null
          assessment?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          follow_up_date?: string | null
          follow_up_priority?:
            | Database["public"]["Enums"]["priority_level"]
            | null
          goals?: string | null
          home_exercises?: string | null
          id?: string
          next_plan?: string | null
          patient_id: string
          patient_response?: string | null
          progress?: string | null
          recommendations?: string | null
          requires_follow_up?: boolean
          summary?: string | null
          therapist_id?: string | null
          treatment_date?: string
          updated_at?: string
        }
        Update: {
          activities?: string | null
          additional_notes?: string | null
          appointment_id?: string | null
          assessment?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          follow_up_date?: string | null
          follow_up_priority?:
            | Database["public"]["Enums"]["priority_level"]
            | null
          goals?: string | null
          home_exercises?: string | null
          id?: string
          next_plan?: string | null
          patient_id?: string
          patient_response?: string | null
          progress?: string | null
          recommendations?: string | null
          requires_follow_up?: boolean
          summary?: string | null
          therapist_id?: string | null
          treatment_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          closes_at: string
          created_at: string
          id: string
          is_active: boolean
          location_id: string
          opens_at: string
          slot_minutes: number
          weekday: number
        }
        Insert: {
          closes_at: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id: string
          opens_at: string
          slot_minutes?: number
          weekday: number
        }
        Update: {
          closes_at?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string
          opens_at?: string
          slot_minutes?: number
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      taken_slots: {
        Row: {
          duration_minutes: number | null
          location_id: string | null
          slot_at: string | null
        }
        Insert: {
          duration_minutes?: number | null
          location_id?: string | null
          slot_at?: string | null
        }
        Update: {
          duration_minutes?: number | null
          location_id?: string | null
          slot_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_language: "ar" | "he" | "en"
      app_role: "admin" | "therapist" | "secretary"
      appointment_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "arrived"
        | "completed"
        | "no_show"
      appointment_status_ext:
        | "scheduled"
        | "confirmed"
        | "arrived"
        | "completed"
        | "cancelled"
        | "no_show"
      gender: "male" | "female" | "other"
      insurance_provider: "clalit_mushlam" | "other"
      insurance_status:
        | "not_sent"
        | "waiting"
        | "approved"
        | "paid"
        | "rejected"
      patient_file_category:
        | "medical_report"
        | "assessment"
        | "insurance"
        | "referral"
        | "signed_form"
        | "treatment_plan"
        | "other"
      payment_type: "private" | "insurance" | "mixed"
      priority_level: "low" | "medium" | "high"
      reminder_status: "pending" | "scheduled" | "completed" | "dismissed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_language: ["ar", "he", "en"],
      app_role: ["admin", "therapist", "secretary"],
      appointment_status: [
        "pending",
        "confirmed",
        "cancelled",
        "arrived",
        "completed",
        "no_show",
      ],
      appointment_status_ext: [
        "scheduled",
        "confirmed",
        "arrived",
        "completed",
        "cancelled",
        "no_show",
      ],
      gender: ["male", "female", "other"],
      insurance_provider: ["clalit_mushlam", "other"],
      insurance_status: ["not_sent", "waiting", "approved", "paid", "rejected"],
      patient_file_category: [
        "medical_report",
        "assessment",
        "insurance",
        "referral",
        "signed_form",
        "treatment_plan",
        "other",
      ],
      payment_type: ["private", "insurance", "mixed"],
      priority_level: ["low", "medium", "high"],
      reminder_status: ["pending", "scheduled", "completed", "dismissed"],
    },
  },
} as const

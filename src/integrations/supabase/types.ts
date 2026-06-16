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
      appointment_products: {
        Row: {
          appointment_id: string
          cantidad: number
          created_at: string
          id: string
          nombre: string
          precio: number
          product_id: string | null
        }
        Insert: {
          appointment_id: string
          cantidad?: number
          created_at?: string
          id?: string
          nombre: string
          precio?: number
          product_id?: string | null
        }
        Update: {
          appointment_id?: string
          cantidad?: number
          created_at?: string
          id?: string
          nombre?: string
          precio?: number
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_products_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          branch_id: string | null
          confirmation_status: string
          created_at: string
          created_by: string | null
          diagnostico: string | null
          doctor_id: string | null
          estado: Database["public"]["Enums"]["appointment_status"]
          fecha: string
          hora: string | null
          id: string
          motivo: string | null
          observaciones: string | null
          patient_id: string
          requested_by_patient: boolean
          room_id: string | null
          sintomas: string | null
          tratamiento: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          confirmation_status?: string
          created_at?: string
          created_by?: string | null
          diagnostico?: string | null
          doctor_id?: string | null
          estado?: Database["public"]["Enums"]["appointment_status"]
          fecha: string
          hora?: string | null
          id?: string
          motivo?: string | null
          observaciones?: string | null
          patient_id: string
          requested_by_patient?: boolean
          room_id?: string | null
          sintomas?: string | null
          tratamiento?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          confirmation_status?: string
          created_at?: string
          created_by?: string | null
          diagnostico?: string | null
          doctor_id?: string | null
          estado?: Database["public"]["Enums"]["appointment_status"]
          fecha?: string
          hora?: string | null
          id?: string
          motivo?: string | null
          observaciones?: string | null
          patient_id?: string
          requested_by_patient?: boolean
          room_id?: string | null
          sintomas?: string | null
          tratamiento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
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
            foreignKeyName: "appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "branch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_rooms: {
        Row: {
          assigned_doctor_id: string | null
          branch_id: string
          created_at: string
          doctor_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          assigned_doctor_id?: string | null
          branch_id: string
          created_at?: string
          doctor_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          assigned_doctor_id?: string | null
          branch_id?: string
          created_at?: string
          doctor_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_rooms_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_rooms_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_rooms_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          city: string | null
          created_at: string
          doctor_id: string
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          room_count: number
          updated_at: string
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          room_count?: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          room_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_modules: {
        Row: {
          citas: boolean
          created_at: string
          doctor_id: string
          google_calendar: boolean
          inventario: boolean
          monitor: boolean
          pos: boolean
          recordatorios: boolean
          reportes: boolean
          updated_at: string
        }
        Insert: {
          citas?: boolean
          created_at?: string
          doctor_id: string
          google_calendar?: boolean
          inventario?: boolean
          monitor?: boolean
          pos?: boolean
          recordatorios?: boolean
          reportes?: boolean
          updated_at?: string
        }
        Update: {
          citas?: boolean
          created_at?: string
          doctor_id?: string
          google_calendar?: boolean
          inventario?: boolean
          monitor?: boolean
          pos?: boolean
          recordatorios?: boolean
          reportes?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_modules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_oauth: {
        Row: {
          access_token: string | null
          created_at: string
          doctor_id: string
          id: string
          provider: string
          refresh_token: string | null
          scope: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_oauth_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          active: boolean
          branch_id: string | null
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          slot_minutes: number
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          branch_id?: string | null
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          slot_minutes?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          branch_id?: string | null
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          slot_minutes?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_staff: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_staff_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          brand_color: string | null
          created_at: string
          display_name: string
          google_calendar_connected: boolean
          google_calendar_id: string | null
          id: string
          logo_url: string | null
          specialty: string | null
          updated_at: string
          user_id: string
          whatsapp_phone: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          display_name: string
          google_calendar_connected?: boolean
          google_calendar_id?: string | null
          id?: string
          logo_url?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
          whatsapp_phone?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          display_name?: string
          google_calendar_connected?: boolean
          google_calendar_id?: string | null
          id?: string
          logo_url?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_id: string
          id: string
          product_id: string
          qty: number
          reason: string | null
          sale_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_id: string
          id?: string
          product_id: string
          qty: number
          reason?: string | null
          sale_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          id?: string
          product_id?: string
          qty?: number
          reason?: string | null
          sale_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          doctor_id: string
          id: string
          payload: Json
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          payload?: Json
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          correo: string | null
          created_at: string
          created_by: string | null
          doctor_id: string | null
          fecha_registro: string
          first_name: string | null
          guardian_first_name: string | null
          guardian_last_name_materno: string | null
          guardian_last_name_paterno: string | null
          guardian_patient_id: string | null
          id: string
          last_name_materno: string | null
          last_name_paterno: string | null
          locality: string | null
          nombre: string
          observaciones: string | null
          pending_validation: boolean
          telefono: string | null
          tipo_pago: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          correo?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          fecha_registro?: string
          first_name?: string | null
          guardian_first_name?: string | null
          guardian_last_name_materno?: string | null
          guardian_last_name_paterno?: string | null
          guardian_patient_id?: string | null
          id?: string
          last_name_materno?: string | null
          last_name_paterno?: string | null
          locality?: string | null
          nombre: string
          observaciones?: string | null
          pending_validation?: boolean
          telefono?: string | null
          tipo_pago?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          correo?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          fecha_registro?: string
          first_name?: string | null
          guardian_first_name?: string | null
          guardian_last_name_materno?: string | null
          guardian_last_name_paterno?: string | null
          guardian_patient_id?: string | null
          id?: string
          last_name_materno?: string | null
          last_name_paterno?: string | null
          locality?: string | null
          nombre?: string
          observaciones?: string | null
          pending_validation?: boolean
          telefono?: string | null
          tipo_pago?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_guardian_patient_id_fkey"
            columns: ["guardian_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          doctor_id: string | null
          id: string
          kind: string
          min_stock: number
          nombre: string
          precio: number
          stock: number
          track_inventory: boolean
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          doctor_id?: string | null
          id?: string
          kind?: string
          min_stock?: number
          nombre: string
          precio?: number
          stock?: number
          track_inventory?: boolean
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          doctor_id?: string | null
          id?: string
          kind?: string
          min_stock?: number
          nombre?: string
          precio?: number
          stock?: number
          track_inventory?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          created_at: string
          doctor_id: string
          enabled: boolean
          hours_before: number
          send_day_before: boolean
          send_hours_before: boolean
          send_same_day: boolean
          send_time: string
          updated_at: string
          whatsapp_template: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          enabled?: boolean
          hours_before?: number
          send_day_before?: boolean
          send_hours_before?: boolean
          send_same_day?: boolean
          send_time?: string
          updated_at?: string
          whatsapp_template?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          enabled?: boolean
          hours_before?: number
          send_day_before?: boolean
          send_hours_before?: boolean
          send_same_day?: boolean
          send_time?: string
          updated_at?: string
          whatsapp_template?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_settings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          is_service: boolean
          name: string
          product_id: string | null
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_service?: boolean
          name: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          subtotal?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_service?: boolean
          name?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          reference: string | null
          sale_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          method: string
          reference?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          reference?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          appointment_id: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          id: string
          notes: string | null
          paid: number
          patient_id: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id: string
          id?: string
          notes?: string | null
          paid?: number
          patient_id?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          id?: string
          notes?: string | null
          paid?: number
          patient_id?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_doctor: { Args: { _doctor_id: string }; Returns: boolean }
      current_doctor_id: { Args: never; Returns: string }
      current_staff_doctor_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_doctor_owner: { Args: { _doctor_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "doctor"
        | "recepcion"
        | "asistente"
        | "monitor"
        | "super_admin"
      appointment_status: "pendiente" | "completada" | "cancelada"
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
      app_role: [
        "admin",
        "user",
        "doctor",
        "recepcion",
        "asistente",
        "monitor",
        "super_admin",
      ],
      appointment_status: ["pendiente", "completada", "cancelada"],
    },
  },
} as const

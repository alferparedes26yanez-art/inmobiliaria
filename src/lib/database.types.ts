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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      avaluo: {
        Row: {
          cod_avaluo: number
          cod_propiedad: number
          fecha_avaluo: string
          nivel_acabados: string | null
          valor_avaluo_usd: number
        }
        Insert: {
          cod_avaluo?: number
          cod_propiedad: number
          fecha_avaluo: string
          nivel_acabados?: string | null
          valor_avaluo_usd: number
        }
        Update: {
          cod_avaluo?: number
          cod_propiedad?: number
          fecha_avaluo?: string
          nivel_acabados?: string | null
          valor_avaluo_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_avaluo_propiedad"
            columns: ["cod_propiedad"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["cod_propiedad"]
          },
          {
            foreignKeyName: "fk_avaluo_propiedad"
            columns: ["cod_propiedad"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cod_propiedad"]
          },
        ]
      }
      cita: {
        Row: {
          cod_cita: number
          cod_interes: number
          estado_cita: string
          fecha: string
          fecha_creacion: string
          hora: string
        }
        Insert: {
          cod_cita?: number
          cod_interes: number
          estado_cita?: string
          fecha: string
          fecha_creacion?: string
          hora: string
        }
        Update: {
          cod_cita?: number
          cod_interes?: number
          estado_cita?: string
          fecha?: string
          fecha_creacion?: string
          hora?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cita_interes"
            columns: ["cod_interes"]
            isOneToOne: false
            referencedRelation: "interes"
            referencedColumns: ["cod_interes"]
          },
          {
            foreignKeyName: "fk_cita_interes"
            columns: ["cod_interes"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cod_interes"]
          },
        ]
      }
      cliente: {
        Row: {
          apellido: string
          cedula: string
          correo: string
          fecha_registro: string
          nombre: string
          telefono: string
        }
        Insert: {
          apellido: string
          cedula: string
          correo: string
          fecha_registro?: string
          nombre: string
          telefono: string
        }
        Update: {
          apellido?: string
          cedula?: string
          correo?: string
          fecha_registro?: string
          nombre?: string
          telefono?: string
        }
        Relationships: []
      }
      foto: {
        Row: {
          cod_foto: number
          cod_propiedad: number
          es_principal: boolean
          orden: number
          url: string
        }
        Insert: {
          cod_foto?: number
          cod_propiedad: number
          es_principal?: boolean
          orden?: number
          url: string
        }
        Update: {
          cod_foto?: number
          cod_propiedad?: number
          es_principal?: boolean
          orden?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_foto_propiedad"
            columns: ["cod_propiedad"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["cod_propiedad"]
          },
          {
            foreignKeyName: "fk_foto_propiedad"
            columns: ["cod_propiedad"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cod_propiedad"]
          },
        ]
      }
      interes: {
        Row: {
          cedula: string
          cod_interes: number
          cod_propiedad: number
          etapa: string
          fecha_actualizacion: string
          monto_anticipo_usd: number | null
        }
        Insert: {
          cedula: string
          cod_interes?: number
          cod_propiedad: number
          etapa?: string
          fecha_actualizacion?: string
          monto_anticipo_usd?: number | null
        }
        Update: {
          cedula?: string
          cod_interes?: number
          cod_propiedad?: number
          etapa?: string
          fecha_actualizacion?: string
          monto_anticipo_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_interes_cliente"
            columns: ["cedula"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["cedula"]
          },
          {
            foreignKeyName: "fk_interes_cliente"
            columns: ["cedula"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cedula"]
          },
          {
            foreignKeyName: "fk_interes_cliente"
            columns: ["cedula"]
            isOneToOne: false
            referencedRelation: "v_cliente_cartera"
            referencedColumns: ["cedula"]
          },
          {
            foreignKeyName: "fk_interes_propiedad"
            columns: ["cod_propiedad"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["cod_propiedad"]
          },
          {
            foreignKeyName: "fk_interes_propiedad"
            columns: ["cod_propiedad"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cod_propiedad"]
          },
        ]
      }
      notificacion_whatsapp: {
        Row: {
          cod_cita: number
          cod_notificacion: number
          estado_envio: string
          fecha_envio: string | null
          mensaje: string
        }
        Insert: {
          cod_cita: number
          cod_notificacion?: number
          estado_envio?: string
          fecha_envio?: string | null
          mensaje: string
        }
        Update: {
          cod_cita?: number
          cod_notificacion?: number
          estado_envio?: string
          fecha_envio?: string | null
          mensaje?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notificacion_cita"
            columns: ["cod_cita"]
            isOneToOne: false
            referencedRelation: "cita"
            referencedColumns: ["cod_cita"]
          },
          {
            foreignKeyName: "fk_notificacion_cita"
            columns: ["cod_cita"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cod_cita"]
          },
        ]
      }
      propiedad: {
        Row: {
          area_construccion_m2: number | null
          area_terreno_m2: number | null
          cod_propiedad: number
          cod_sector: number
          cod_tipo: number
          descripcion: string | null
          direccion: string
          estado: string
          fecha_registro: string
          latitud: number
          longitud: number
          nombre_comercial: string
          precio_usd: number
        }
        Insert: {
          area_construccion_m2?: number | null
          area_terreno_m2?: number | null
          cod_propiedad?: number
          cod_sector: number
          cod_tipo: number
          descripcion?: string | null
          direccion: string
          estado?: string
          fecha_registro?: string
          latitud: number
          longitud: number
          nombre_comercial: string
          precio_usd: number
        }
        Update: {
          area_construccion_m2?: number | null
          area_terreno_m2?: number | null
          cod_propiedad?: number
          cod_sector?: number
          cod_tipo?: number
          descripcion?: string | null
          direccion?: string
          estado?: string
          fecha_registro?: string
          latitud?: number
          longitud?: number
          nombre_comercial?: string
          precio_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_propiedad_sector"
            columns: ["cod_sector"]
            isOneToOne: false
            referencedRelation: "sector"
            referencedColumns: ["cod_sector"]
          },
          {
            foreignKeyName: "fk_propiedad_tipo"
            columns: ["cod_tipo"]
            isOneToOne: false
            referencedRelation: "tipo_propiedad"
            referencedColumns: ["cod_tipo"]
          },
        ]
      }
      propiedad_servicio: {
        Row: {
          cod_propiedad: number
          cod_servicio: number
          estado_servicio: string
        }
        Insert: {
          cod_propiedad: number
          cod_servicio: number
          estado_servicio: string
        }
        Update: {
          cod_propiedad?: number
          cod_servicio?: number
          estado_servicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_propserv_propiedad"
            columns: ["cod_propiedad"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["cod_propiedad"]
          },
          {
            foreignKeyName: "fk_propserv_propiedad"
            columns: ["cod_propiedad"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cod_propiedad"]
          },
          {
            foreignKeyName: "fk_propserv_servicio"
            columns: ["cod_servicio"]
            isOneToOne: false
            referencedRelation: "servicio_basico"
            referencedColumns: ["cod_servicio"]
          },
        ]
      }
      sector: {
        Row: {
          ciudad: string
          cod_sector: number
          nombre: string
        }
        Insert: {
          ciudad: string
          cod_sector?: number
          nombre: string
        }
        Update: {
          ciudad?: string
          cod_sector?: number
          nombre?: string
        }
        Relationships: []
      }
      seguimiento_cliente: {
        Row: {
          cedula: string
          cod_seguimiento: number
          fecha: string
          medio: string
          mensaje: string
          usuario: string
        }
        Insert: {
          cedula: string
          cod_seguimiento?: number
          fecha?: string
          medio: string
          mensaje: string
          usuario: string
        }
        Update: {
          cedula?: string
          cod_seguimiento?: number
          fecha?: string
          medio?: string
          mensaje?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_seguimiento_cliente"
            columns: ["cedula"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["cedula"]
          },
          {
            foreignKeyName: "fk_seguimiento_cliente"
            columns: ["cedula"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cedula"]
          },
          {
            foreignKeyName: "fk_seguimiento_cliente"
            columns: ["cedula"]
            isOneToOne: false
            referencedRelation: "v_cliente_cartera"
            referencedColumns: ["cedula"]
          },
          {
            foreignKeyName: "fk_seguimiento_usuario"
            columns: ["usuario"]
            isOneToOne: false
            referencedRelation: "usuario_admin"
            referencedColumns: ["usuario"]
          },
        ]
      }
      servicio_basico: {
        Row: {
          cod_servicio: number
          nombre: string
        }
        Insert: {
          cod_servicio?: number
          nombre: string
        }
        Update: {
          cod_servicio?: number
          nombre?: string
        }
        Relationships: []
      }
      tipo_propiedad: {
        Row: {
          cod_tipo: number
          nombre: string
        }
        Insert: {
          cod_tipo?: number
          nombre: string
        }
        Update: {
          cod_tipo?: number
          nombre?: string
        }
        Relationships: []
      }
      usuario_admin: {
        Row: {
          apellido: string
          auth_user_id: string
          correo: string
          nombre: string
          rol: string
          usuario: string
        }
        Insert: {
          apellido: string
          auth_user_id: string
          correo: string
          nombre: string
          rol?: string
          usuario: string
        }
        Update: {
          apellido?: string
          auth_user_id?: string
          correo?: string
          nombre?: string
          rol?: string
          usuario?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_cita_detalle: {
        Row: {
          apellido: string | null
          cedula: string | null
          cod_cita: number | null
          cod_interes: number | null
          cod_propiedad: number | null
          direccion: string | null
          estado_cita: string | null
          estado_confirmacion: string | null
          estado_recordatorio: string | null
          etapa: string | null
          fecha: string | null
          fecha_creacion: string | null
          hora: string | null
          nombre: string | null
          nombre_comercial: string | null
          telefono: string | null
        }
        Relationships: []
      }
      v_cliente_cartera: {
        Row: {
          apellido: string | null
          cedula: string | null
          cod_propiedad_actual: number | null
          correo: string | null
          etapa_actual: string | null
          fecha_registro: string | null
          nombre: string | null
          para_recuperar: boolean | null
          propiedad_actual: string | null
          telefono: string | null
          total_intereses: number | null
          ultimo_contacto: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_interes_propiedad"
            columns: ["cod_propiedad_actual"]
            isOneToOne: false
            referencedRelation: "propiedad"
            referencedColumns: ["cod_propiedad"]
          },
          {
            foreignKeyName: "fk_interes_propiedad"
            columns: ["cod_propiedad_actual"]
            isOneToOne: false
            referencedRelation: "v_cita_detalle"
            referencedColumns: ["cod_propiedad"]
          },
        ]
      }
    }
    Functions: {
      agendar_visita: {
        Args: {
          p_apellido: string
          p_cedula: string
          p_cod_propiedad: number
          p_correo: string
          p_fecha: string
          p_hora: string
          p_nombre: string
          p_telefono: string
        }
        Returns: number
      }
      dashboard_clientes_registrados: {
        Args: { p_meses?: number }
        Returns: {
          periodo: string
          total: number
        }[]
      }
      dashboard_embudo: {
        Args: never
        Returns: {
          etapa: string
          orden: number
          total: number
        }[]
      }
      dashboard_heatmap_citas: {
        Args: never
        Returns: {
          dia_semana: number
          hora: number
          total: number
        }[]
      }
      dashboard_kpis: {
        Args: never
        Returns: {
          indicador: string
          valor: number
          valor_anterior: number
          variacion_pct: number
        }[]
      }
      dashboard_ventas_por_mes: {
        Args: { p_meses?: number }
        Returns: {
          mes: string
          monto_usd: number
          total: number
        }[]
      }
      es_admin: { Args: never; Returns: boolean }
      guardar_propiedad: {
        Args: {
          p_avaluo?: Json
          p_cod_propiedad: number
          p_datos: Json
          p_servicios?: Json
        }
        Returns: number
      }
      horarios_ocupados: {
        Args: { p_cod_propiedad: number; p_fecha: string }
        Returns: string[]
      }
      marcar_foto_principal: {
        Args: { p_cod_foto: number }
        Returns: undefined
      }
      programar_recordatorios: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

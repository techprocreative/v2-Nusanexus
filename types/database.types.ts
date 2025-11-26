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
          role: 'user' | 'admin'
          status: 'active' | 'inactive'
          first_name: string
          last_name: string
          language: string | null
          current_workspace_id: string | null
          recovery_token: string | null
          email_verified_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          role?: 'user' | 'admin'
          status?: 'active' | 'inactive'
          first_name?: string
          last_name?: string
          language?: string | null
          current_workspace_id?: string | null
          recovery_token?: string | null
          email_verified_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          role?: 'user' | 'admin'
          status?: 'active' | 'inactive'
          first_name?: string
          last_name?: string
          language?: string | null
          current_workspace_id?: string | null
          recovery_token?: string | null
          email_verified_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      workspaces: {
        Row: {
          id: string
          owner_id: string | null
          subscription_id: string | null
          name: string
          credit_count: number | null
          is_trialed: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          subscription_id?: string | null
          name: string
          credit_count?: number | null
          is_trialed?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          subscription_id?: string | null
          name?: string
          credit_count?: number | null
          is_trialed?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: string
          joined_at: string | null
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: string
          joined_at?: string | null
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: string
          joined_at?: string | null
        }
      }
      workspace_invitations: {
        Row: {
          id: string
          workspace_id: string | null
          email: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          email: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          email?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      plans: {
        Row: {
          id: string
          title: string
          description: string | null
          icon: string | null
          feature_list: string[] | null
          price: number
          billing_cycle: 'monthly' | 'yearly' | 'lifetime' | 'one-time' | null
          credit_count: number | null
          config: Json
          status: number
          is_featured: boolean
          superiority: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          icon?: string | null
          feature_list?: string[] | null
          price: number
          billing_cycle?: 'monthly' | 'yearly' | 'lifetime' | 'one-time' | null
          credit_count?: number | null
          config?: Json
          status?: number
          is_featured?: boolean
          superiority?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          icon?: string | null
          feature_list?: string[] | null
          price?: number
          billing_cycle?: 'monthly' | 'yearly' | 'lifetime' | 'one-time' | null
          credit_count?: number | null
          config?: Json
          status?: number
          is_featured?: boolean
          superiority?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      plan_snapshots: {
        Row: {
          id: string
          plan_id: string | null
          title: string
          description: string | null
          icon: string | null
          feature_list: string[] | null
          price: number
          billing_cycle: string | null
          credit_count: number | null
          config: Json
          created_at: string
        }
        Insert: {
          id?: string
          plan_id?: string | null
          title: string
          description?: string | null
          icon?: string | null
          feature_list?: string[] | null
          price: number
          billing_cycle?: string | null
          credit_count?: number | null
          config?: Json
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string | null
          title?: string
          description?: string | null
          icon?: string | null
          feature_list?: string[] | null
          price?: number
          billing_cycle?: string | null
          credit_count?: number | null
          config?: Json
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          workspace_id: string
          plan_id: string | null
          plan_snapshot_id: string | null
          payment_gateway: string | null
          external_id: string | null
          customer_external_id: string | null
          price_external_id: string | null
          product_external_id: string | null
          currency_code: string
          trial_period_days: number | null
          usage_count: number
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'ended'
          created_at: string
          updated_at: string | null
          canceled_at: string | null
          renew_at: string | null
          reset_credits_at: string | null
          ended_at: string | null
          -- Tripay/Midtrans billing fields
          payment_gateway_id: string | null
          external_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean | null
        }
        Insert: {
          id?: string
          workspace_id: string
          plan_id?: string | null
          plan_snapshot_id?: string | null
          payment_gateway?: string | null
          external_id?: string | null
          customer_external_id?: string | null
          price_external_id?: string | null
          product_external_id?: string | null
          currency_code?: string
          trial_period_days?: number | null
          usage_count?: number
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'ended'
          created_at?: string
          updated_at?: string | null
          canceled_at?: string | null
          renew_at?: string | null
          reset_credits_at?: string | null
          ended_at?: string | null
          payment_gateway_id?: string | null
          external_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
        }
        Update: {
          id?: string
          workspace_id?: string
          plan_id?: string | null
          plan_snapshot_id?: string | null
          payment_gateway?: string | null
          external_id?: string | null
          customer_external_id?: string | null
          price_external_id?: string | null
          product_external_id?: string | null
          currency_code?: string
          trial_period_days?: number | null
          usage_count?: number
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'ended'
          created_at?: string
          updated_at?: string | null
          canceled_at?: string | null
          renew_at?: string | null
          reset_credits_at?: string | null
          ended_at?: string | null
          payment_gateway_id?: string | null
          external_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
        }
      }
      orders: {
        Row: {
          id: string
          workspace_id: string
          plan_snapshot_id: string
          coupon_id: string | null
          currency_code: string
          is_paid: boolean
          is_fulfilled: boolean
          trial_period_days: number | null
          payment_gateway: string | null
          external_id: string | null
          total_amount: number
          discount_amount: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          plan_snapshot_id: string
          coupon_id?: string | null
          currency_code?: string
          is_paid?: boolean
          is_fulfilled?: boolean
          trial_period_days?: number | null
          payment_gateway?: string | null
          external_id?: string | null
          total_amount: number
          discount_amount?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          plan_snapshot_id?: string
          coupon_id?: string | null
          currency_code?: string
          is_paid?: boolean
          is_fulfilled?: boolean
          trial_period_days?: number | null
          payment_gateway?: string | null
          external_id?: string | null
          total_amount?: number
          discount_amount?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          title: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      presets: {
        Row: {
          id: string
          category_id: string | null
          type: string
          status: number
          is_locked: boolean
          title: string
          description: string | null
          template: string | null
          image: string | null
          color: string | null
          config: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          type: string
          status?: number
          is_locked?: boolean
          title: string
          description?: string | null
          template?: string | null
          image?: string | null
          color?: string | null
          config?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string | null
          type?: string
          status?: number
          is_locked?: boolean
          title?: string
          description?: string | null
          template?: string | null
          image?: string | null
          color?: string | null
          config?: Json
          created_at?: string
          updated_at?: string | null
        }
      }
      voices: {
        Row: {
          id: string
          provider: string
          model: string
          external_id: string
          name: string
          status: number
          gender: 'male' | 'female' | 'neutral' | null
          accent: string | null
          age: 'young' | 'middle_aged' | 'old' | null
          tone: string | null
          use_case: string | null
          sample_url: string | null
          supported_languages: string[] | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          provider: string
          model: string
          external_id: string
          name: string
          status?: number
          gender?: 'male' | 'female' | 'neutral' | null
          accent?: string | null
          age?: 'young' | 'middle_aged' | 'old' | null
          tone?: string | null
          use_case?: string | null
          sample_url?: string | null
          supported_languages?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          provider?: string
          model?: string
          external_id?: string
          name?: string
          status?: number
          gender?: 'male' | 'female' | 'neutral' | null
          accent?: string | null
          age?: 'young' | 'middle_aged' | 'old' | null
          tone?: string | null
          use_case?: string | null
          sample_url?: string | null
          supported_languages?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
      }
      library_items: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          preset_id: string | null
          output_file_id: string | null
          input_file_id: string | null
          voice_id: string | null
          type: string
          visibility: number
          title: string | null
          content: string | null
          request_params: Json
          model: string
          used_credit_count: number | null
          cost: Json
          metadata: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          preset_id?: string | null
          output_file_id?: string | null
          input_file_id?: string | null
          voice_id?: string | null
          type: string
          visibility?: number
          title?: string | null
          content?: string | null
          request_params?: Json
          model: string
          used_credit_count?: number | null
          cost?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          preset_id?: string | null
          output_file_id?: string | null
          input_file_id?: string | null
          voice_id?: string | null
          type?: string
          visibility?: number
          title?: string | null
          content?: string | null
          request_params?: Json
          model?: string
          used_credit_count?: number | null
          cost?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          assistant_id: string | null
          title: string | null
          model: string | null
          total_credit_count: number
          message_count: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          assistant_id?: string | null
          title?: string | null
          model?: string | null
          total_credit_count?: number
          message_count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          assistant_id?: string | null
          title?: string | null
          model?: string | null
          total_credit_count?: number
          message_count?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          parent_id: string | null
          user_id: string | null
          assistant_id: string | null
          file_id: string | null
          role: 'user' | 'assistant' | 'system'
          content: string | null
          quote: string | null
          model: string | null
          used_credit_count: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          parent_id?: string | null
          user_id?: string | null
          assistant_id?: string | null
          file_id?: string | null
          role: 'user' | 'assistant' | 'system'
          content?: string | null
          quote?: string | null
          model?: string | null
          used_credit_count?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          parent_id?: string | null
          user_id?: string | null
          assistant_id?: string | null
          file_id?: string | null
          role?: 'user' | 'assistant' | 'system'
          content?: string | null
          quote?: string | null
          model?: string | null
          used_credit_count?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      assistants: {
        Row: {
          id: string
          status: number
          name: string
          expertise: string | null
          description: string | null
          instructions: string | null
          avatar_url: string | null
          model: string
          config: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          status?: number
          name: string
          expertise?: string | null
          description?: string | null
          instructions?: string | null
          avatar_url?: string | null
          model?: string
          config?: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          status?: number
          name?: string
          expertise?: string | null
          description?: string | null
          instructions?: string | null
          avatar_url?: string | null
          model?: string
          config?: Json
          created_at?: string
          updated_at?: string | null
        }
      }
      files: {
        Row: {
          id: string
          storage: string
          object_key: string
          url: string
          size: number
          mime_type: string | null
          width: number | null
          height: number | null
          blur_hash: string | null
          duration: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          storage?: string
          object_key: string
          url: string
          size: number
          mime_type?: string | null
          width?: number | null
          height?: number | null
          blur_hash?: string | null
          duration?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          storage?: string
          object_key?: string
          url?: string
          size?: number
          mime_type?: string | null
          width?: number | null
          height?: number | null
          blur_hash?: string | null
          duration?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      options: {
        Row: {
          id: string
          key: string
          value: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      payment_gateways: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean | null
          is_sandbox: boolean | null
          credentials_encrypted: string
          settings: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          credentials_encrypted: string
          settings?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean | null
          is_sandbox?: boolean | null
          credentials_encrypted?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          display_name: string
          monthly_credits: number
          price: number
          features: Json | null
          is_active: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          monthly_credits: number
          price: number
          features?: Json | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          monthly_credits?: number
          price?: number
          features?: Json | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
      credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          price: number
          discount_percentage: number | null
          is_active: boolean | null
          sort_order: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          credits: number
          price: number
          discount_percentage?: number | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          credits?: number
          price?: number
          discount_percentage?: number | null
          is_active?: boolean | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
      payment_transactions: {
        Row: {
          id: string
          workspace_id: string | null
          user_id: string | null
          payment_gateway_id: string | null
          external_transaction_id: string | null
          payment_method: string | null
          type: string
          amount: number
          status: string
          subscription_id: string | null
          credit_package_id: string | null
          credits_purchased: number | null
          payment_url: string | null
          payment_instructions: Json | null
          paid_at: string | null
          expired_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          user_id?: string | null
          payment_gateway_id?: string | null
          external_transaction_id?: string | null
          payment_method?: string | null
          type: string
          amount: number
          status?: string
          subscription_id?: string | null
          credit_package_id?: string | null
          credits_purchased?: number | null
          payment_url?: string | null
          payment_instructions?: Json | null
          paid_at?: string | null
          expired_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          user_id?: string | null
          payment_gateway_id?: string | null
          external_transaction_id?: string | null
          payment_method?: string | null
          type?: string
          amount?: number
          status?: string
          subscription_id?: string | null
          credit_package_id?: string | null
          credits_purchased?: number | null
          payment_url?: string | null
          payment_instructions?: Json | null
          paid_at?: string | null
          expired_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      user_payment_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_gateway_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          preferred_gateway_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          preferred_gateway_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

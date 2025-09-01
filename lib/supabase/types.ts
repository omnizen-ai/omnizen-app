export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      agent_conversations: {
        Row: {
          agent_id: string
          context: Json | null
          created_at: string
          id: string
          is_active: boolean
          last_message_at: string | null
          message_count: number
          metadata: Json | null
          organization_id: string
          session_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          context?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          message_count?: number
          metadata?: Json | null
          organization_id: string
          session_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          context?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_message_at?: string | null
          message_count?: number
          metadata?: Json | null
          organization_id?: string
          session_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_agent_id_ai_agents_id_fk"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_user_id_User_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_executions: {
        Row: {
          agent_id: string
          completed_at: string | null
          completion_tokens: number | null
          created_at: string
          data_accessed: Json | null
          data_modified: Json | null
          error_details: Json | null
          error_message: string | null
          estimated_cost: number | null
          execution_number: string
          execution_time_ms: number | null
          external_api_calls: Json | null
          id: string
          input_context: Json
          input_prompt: string | null
          organization_id: string
          output_result: Json | null
          output_summary: string | null
          parent_execution_id: string | null
          prompt_tokens: number | null
          retry_count: number | null
          session_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["execution_status"]
          task_description: string | null
          task_type: string
          tools_used: Json | null
          total_tokens: number | null
          trigger_metadata: Json | null
          triggered_by: string
          triggered_by_id: string | null
          user_feedback: string | null
          user_rating: number | null
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          completion_tokens?: number | null
          created_at?: string
          data_accessed?: Json | null
          data_modified?: Json | null
          error_details?: Json | null
          error_message?: string | null
          estimated_cost?: number | null
          execution_number: string
          execution_time_ms?: number | null
          external_api_calls?: Json | null
          id?: string
          input_context: Json
          input_prompt?: string | null
          organization_id: string
          output_result?: Json | null
          output_summary?: string | null
          parent_execution_id?: string | null
          prompt_tokens?: number | null
          retry_count?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
          task_description?: string | null
          task_type: string
          tools_used?: Json | null
          total_tokens?: number | null
          trigger_metadata?: Json | null
          triggered_by: string
          triggered_by_id?: string | null
          user_feedback?: string | null
          user_rating?: number | null
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          completion_tokens?: number | null
          created_at?: string
          data_accessed?: Json | null
          data_modified?: Json | null
          error_details?: Json | null
          error_message?: string | null
          estimated_cost?: number | null
          execution_number?: string
          execution_time_ms?: number | null
          external_api_calls?: Json | null
          id?: string
          input_context?: Json
          input_prompt?: string | null
          organization_id?: string
          output_result?: Json | null
          output_summary?: string | null
          parent_execution_id?: string | null
          prompt_tokens?: number | null
          retry_count?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
          task_description?: string | null
          task_type?: string
          tools_used?: Json | null
          total_tokens?: number | null
          trigger_metadata?: Json | null
          triggered_by?: string
          triggered_by_id?: string | null
          user_feedback?: string | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_agent_id_ai_agents_id_fk"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_executions_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_executions_parent_execution_id_agent_executions_id_fk"
            columns: ["parent_execution_id"]
            isOneToOne: false
            referencedRelation: "agent_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_schedules: {
        Row: {
          agent_id: string
          created_at: string
          cron_expression: string | null
          description: string | null
          end_date: string | null
          event_trigger: string | null
          id: string
          interval_minutes: number | null
          is_active: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          organization_id: string
          schedule_type: string
          start_date: string | null
          task_config: Json
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          cron_expression?: string | null
          description?: string | null
          end_date?: string | null
          event_trigger?: string | null
          id?: string
          interval_minutes?: number | null
          is_active?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          organization_id: string
          schedule_type: string
          start_date?: string | null
          task_config: Json
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          cron_expression?: string | null
          description?: string | null
          end_date?: string | null
          event_trigger?: string | null
          id?: string
          interval_minutes?: number | null
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          organization_id?: string
          schedule_type?: string
          start_date?: string | null
          task_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_schedules_agent_id_ai_agents_id_fk"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_schedules_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          allowed_ip_addresses: Json | null
          avatar: string | null
          capabilities: Json
          config: Json
          created_at: string
          created_by: string | null
          custom_model_endpoint: string | null
          data_access: Json
          description: string | null
          failed_executions: number
          id: string
          instructions: string | null
          knowledge_base_id: string | null
          last_active_at: string | null
          llm_model: Database["public"]["Enums"]["llm_model"]
          max_executions_per_day: number | null
          max_tokens: number | null
          max_tokens_per_execution: number | null
          name: string
          organization_id: string
          slug: string
          status: Database["public"]["Enums"]["agent_status"]
          successful_executions: number
          system_prompt: string
          temperature: number | null
          tools_access: Json
          total_executions: number
          total_tokens_used: number
          type: Database["public"]["Enums"]["agent_type"]
          updated_at: string
          vector_store_id: string | null
          webhooks: Json | null
          workspace_id: string | null
        }
        Insert: {
          allowed_ip_addresses?: Json | null
          avatar?: string | null
          capabilities?: Json
          config?: Json
          created_at?: string
          created_by?: string | null
          custom_model_endpoint?: string | null
          data_access?: Json
          description?: string | null
          failed_executions?: number
          id?: string
          instructions?: string | null
          knowledge_base_id?: string | null
          last_active_at?: string | null
          llm_model?: Database["public"]["Enums"]["llm_model"]
          max_executions_per_day?: number | null
          max_tokens?: number | null
          max_tokens_per_execution?: number | null
          name: string
          organization_id: string
          slug: string
          status?: Database["public"]["Enums"]["agent_status"]
          successful_executions?: number
          system_prompt: string
          temperature?: number | null
          tools_access?: Json
          total_executions?: number
          total_tokens_used?: number
          type: Database["public"]["Enums"]["agent_type"]
          updated_at?: string
          vector_store_id?: string | null
          webhooks?: Json | null
          workspace_id?: string | null
        }
        Update: {
          allowed_ip_addresses?: Json | null
          avatar?: string | null
          capabilities?: Json
          config?: Json
          created_at?: string
          created_by?: string | null
          custom_model_endpoint?: string | null
          data_access?: Json
          description?: string | null
          failed_executions?: number
          id?: string
          instructions?: string | null
          knowledge_base_id?: string | null
          last_active_at?: string | null
          llm_model?: Database["public"]["Enums"]["llm_model"]
          max_executions_per_day?: number | null
          max_tokens?: number | null
          max_tokens_per_execution?: number | null
          name?: string
          organization_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["agent_status"]
          successful_executions?: number
          system_prompt?: string
          temperature?: number | null
          tools_access?: Json
          total_executions?: number
          total_tokens_used?: number
          type?: Database["public"]["Enums"]["agent_type"]
          updated_at?: string
          vector_store_id?: string | null
          webhooks?: Json | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_User_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_accounts: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          provider_account_id: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_accounts_user_id_User_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_lines: {
        Row: {
          account_id: string | null
          bill_id: string
          created_at: string
          description: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          line_number: number
          line_subtotal: number
          line_total: number
          product_id: string | null
          quantity: number
          tax_amount: number | null
          tax_code_id: string | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          account_id?: string | null
          bill_id: string
          created_at?: string
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          line_number: number
          line_subtotal: number
          line_total: number
          product_id?: string | null
          quantity: number
          tax_amount?: number | null
          tax_code_id?: string | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          account_id?: string | null
          bill_id?: string
          created_at?: string
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          line_number?: number
          line_subtotal?: number
          line_total?: number
          product_id?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_code_id?: string | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_lines_account_id_chart_accounts_id_fk"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_lines_bill_id_bills_id_fk"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_lines_product_id_products_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          balance_due: number
          bill_date: string
          bill_number: string
          created_at: string
          currency_code: string
          custom_fields: Json | null
          discount_amount: number | null
          due_date: string
          exchange_rate: number | null
          id: string
          journal_entry_id: string | null
          notes: string | null
          organization_id: string
          paid_amount: number | null
          po_number: string | null
          status: Database["public"]["Enums"]["bill_status"]
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
          vendor_id: string
          vendor_invoice_number: string | null
          workspace_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          balance_due: number
          bill_date: string
          bill_number: string
          created_at?: string
          currency_code?: string
          custom_fields?: Json | null
          discount_amount?: number | null
          due_date: string
          exchange_rate?: number | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          po_number?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          vendor_id: string
          vendor_invoice_number?: string | null
          workspace_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          balance_due?: number
          bill_date?: string
          bill_number?: string
          created_at?: string
          currency_code?: string
          custom_fields?: Json | null
          discount_amount?: number | null
          due_date?: string
          exchange_rate?: number | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          po_number?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          vendor_id?: string
          vendor_invoice_number?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_journal_entry_id_journal_entries_id_fk"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_vendor_id_contacts_id_fk"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_accounts: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          currency_code: string
          current_balance: number
          description: string | null
          id: string
          is_active: boolean
          is_postable: boolean
          is_system_account: boolean
          name: string
          normal_balance: string
          organization_id: string
          parent_id: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          current_balance?: number
          description?: string | null
          id?: string
          is_active?: boolean
          is_postable?: boolean
          is_system_account?: boolean
          name: string
          normal_balance: string
          organization_id: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          current_balance?: number
          description?: string | null
          id?: string
          is_active?: boolean
          is_postable?: boolean
          is_system_account?: boolean
          name?: string
          normal_balance?: string
          organization_id?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_accounts_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_accounts_parent_id_chart_accounts_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_accounts_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      Chat: {
        Row: {
          createdAt: string
          id: string
          title: string
          userId: string
          visibility: string
        }
        Insert: {
          createdAt: string
          id?: string
          title: string
          userId: string
          visibility?: string
        }
        Update: {
          createdAt?: string
          id?: string
          title?: string
          userId?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "Chat_userId_User_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          credit_limit: number | null
          currency_code: string
          custom_fields: Json | null
          default_purchase_account_id: string | null
          default_sales_account_id: string | null
          display_name: string | null
          email: string | null
          external_code: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          mobile: string | null
          notes: string | null
          organization_id: string
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          state: string | null
          tax_id: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string
          website: string | null
          workspace_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          currency_code?: string
          custom_fields?: Json | null
          default_purchase_account_id?: string | null
          default_sales_account_id?: string | null
          display_name?: string | null
          email?: string | null
          external_code?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          organization_id: string
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          website?: string | null
          workspace_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          currency_code?: string
          custom_fields?: Json | null
          default_purchase_account_id?: string | null
          default_sales_account_id?: string | null
          display_name?: string | null
          email?: string | null
          external_code?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          organization_id?: string
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          website?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_default_purchase_account_id_chart_accounts_id_fk"
            columns: ["default_purchase_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_default_sales_account_id_chart_accounts_id_fk"
            columns: ["default_sales_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          execution_id: string | null
          id: string
          metadata: Json | null
          role: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          execution_id?: string | null
          id?: string
          metadata?: Json | null
          role: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          execution_id?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_agent_conversations_id_fk"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_execution_id_agent_executions_id_fk"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "agent_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          decimals: number
          is_active: boolean
          name: string
          symbol: string
        }
        Insert: {
          code: string
          decimals?: number
          is_active?: boolean
          name: string
          symbol: string
        }
        Update: {
          code?: string
          decimals?: number
          is_active?: boolean
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      Document: {
        Row: {
          content: string | null
          createdAt: string
          id: string
          text: string
          title: string
          userId: string
        }
        Insert: {
          content?: string | null
          createdAt: string
          id?: string
          text?: string
          title: string
          userId: string
        }
        Update: {
          content?: string | null
          createdAt?: string
          id?: string
          text?: string
          title?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Document_userId_User_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string
          from_currency: string
          id: string
          organization_id: string
          rate: number
          rate_date: string
          source: string | null
          to_currency: string
        }
        Insert: {
          created_at?: string
          from_currency: string
          id?: string
          organization_id: string
          rate: number
          rate_date: string
          source?: string | null
          to_currency: string
        }
        Update: {
          created_at?: string
          from_currency?: string
          id?: string
          organization_id?: string
          rate?: number
          rate_date?: string
          source?: string | null
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_from_currency_currencies_code_fk"
            columns: ["from_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "exchange_rates_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_rates_to_currency_currencies_code_fk"
            columns: ["to_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          account_id: string | null
          created_at: string
          description: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          invoice_id: string
          line_number: number
          line_subtotal: number
          line_total: number
          product_id: string | null
          quantity: number
          tax_amount: number | null
          tax_code_id: string | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id: string
          line_number: number
          line_subtotal: number
          line_total: number
          product_id?: string | null
          quantity: number
          tax_amount?: number | null
          tax_code_id?: string | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          account_id?: string | null
          created_at?: string
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string
          line_number?: number
          line_subtotal?: number
          line_total?: number
          product_id?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_code_id?: string | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_account_id_chart_accounts_id_fk"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_invoices_id_fk"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_product_id_products_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_due: number
          created_at: string
          currency_code: string
          custom_fields: Json | null
          customer_id: string
          discount_amount: number | null
          due_date: string
          exchange_rate: number | null
          footer: string | null
          id: string
          invoice_number: string
          issue_date: string
          journal_entry_id: string | null
          notes: string | null
          organization_id: string
          paid_amount: number | null
          paid_at: string | null
          po_number: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number | null
          terms: string | null
          total_amount: number
          updated_at: string
          viewed_at: string | null
          workspace_id: string | null
        }
        Insert: {
          balance_due: number
          created_at?: string
          currency_code?: string
          custom_fields?: Json | null
          customer_id: string
          discount_amount?: number | null
          due_date: string
          exchange_rate?: number | null
          footer?: string | null
          id?: string
          invoice_number: string
          issue_date: string
          journal_entry_id?: string | null
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          paid_at?: string | null
          po_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount?: number | null
          terms?: string | null
          total_amount: number
          updated_at?: string
          viewed_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          balance_due?: number
          created_at?: string
          currency_code?: string
          custom_fields?: Json | null
          customer_id?: string
          discount_amount?: number | null
          due_date?: string
          exchange_rate?: number | null
          footer?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          journal_entry_id?: string | null
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          po_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
          viewed_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_contacts_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_journal_entry_id_journal_entries_id_fk"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string
          document_id: string | null
          document_type: string | null
          entry_date: string
          entry_number: string
          id: string
          journal_id: string
          memo: string | null
          organization_id: string
          posted_at: string | null
          reversed_from_id: string | null
          status: Database["public"]["Enums"]["entry_status"]
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          document_id?: string | null
          document_type?: string | null
          entry_date: string
          entry_number: string
          id?: string
          journal_id: string
          memo?: string | null
          organization_id: string
          posted_at?: string | null
          reversed_from_id?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          document_id?: string | null
          document_type?: string | null
          entry_date?: string
          entry_number?: string
          id?: string
          journal_id?: string
          memo?: string | null
          organization_id?: string
          posted_at?: string | null
          reversed_from_id?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_journal_id_journals_id_fk"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversed_from_id_journal_entries_id_fk"
            columns: ["reversed_from_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          contact_id: string | null
          cost_center_id: string | null
          created_at: string
          credit: number
          currency_code: string
          debit: number
          department_id: string | null
          description: string | null
          exchange_rate: number | null
          id: string
          journal_entry_id: string
          line_number: number
          organization_id: string
          product_id: string | null
          project_id: string | null
          tax_code_id: string | null
        }
        Insert: {
          account_id: string
          contact_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit?: number
          currency_code?: string
          debit?: number
          department_id?: string | null
          description?: string | null
          exchange_rate?: number | null
          id?: string
          journal_entry_id: string
          line_number: number
          organization_id: string
          product_id?: string | null
          project_id?: string | null
          tax_code_id?: string | null
        }
        Update: {
          account_id?: string
          contact_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit?: number
          currency_code?: string
          debit?: number
          department_id?: string | null
          description?: string | null
          exchange_rate?: number | null
          id?: string
          journal_entry_id?: string
          line_number?: number
          organization_id?: string
          product_id?: string | null
          project_id?: string | null
          tax_code_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_chart_accounts_id_fk"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_journal_entries_id_fk"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          requires_approval: boolean
          type: Database["public"]["Enums"]["journal_type"]
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          requires_approval?: boolean
          type: Database["public"]["Enums"]["journal_type"]
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          requires_approval?: boolean
          type?: Database["public"]["Enums"]["journal_type"]
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journals_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journals_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          allowed_agents: Json | null
          category: string | null
          content: string
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          embedding_id: string | null
          embedding_model: string | null
          id: string
          is_public: boolean
          organization_id: string
          previous_version_id: string | null
          source_type: string | null
          source_url: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          allowed_agents?: Json | null
          category?: string | null
          content: string
          content_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          embedding_id?: string | null
          embedding_model?: string | null
          id?: string
          is_public?: boolean
          organization_id: string
          previous_version_id?: string | null
          source_type?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          allowed_agents?: Json | null
          category?: string | null
          content?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          embedding_id?: string | null
          embedding_model?: string | null
          id?: string
          is_public?: boolean
          organization_id?: string
          previous_version_id?: string | null
          source_type?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_previous_version_id_knowledge_base_id_fk"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      Message: {
        Row: {
          chatId: string
          content: Json
          createdAt: string
          id: string
          role: string
        }
        Insert: {
          chatId: string
          content: Json
          createdAt: string
          id?: string
          role: string
        }
        Update: {
          chatId?: string
          content?: Json
          createdAt?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
        ]
      }
      Message_v2: {
        Row: {
          attachments: Json
          chatId: string
          createdAt: string
          id: string
          parts: Json
          role: string
        }
        Insert: {
          attachments: Json
          chatId: string
          createdAt: string
          id?: string
          parts: Json
          role: string
        }
        Update: {
          attachments?: Json
          chatId?: string
          createdAt?: string
          id?: string
          parts?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_v2_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          allowed_workspaces: Json | null
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          organization_id: string
          permissions: Json
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          allowed_workspaces?: Json | null
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          organization_id: string
          permissions?: Json
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          allowed_workspaces?: Json | null
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          organization_id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_User_id_fk"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_User_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country_code: string | null
          created_at: string
          currency: string
          data_retention_days: number
          feature_flags: Json
          fiscal_year_start: number
          id: string
          is_active: boolean
          max_ai_agents: number
          max_users: number
          max_workspaces: number
          name: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          timezone: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          currency?: string
          data_retention_days?: number
          feature_flags?: Json
          fiscal_year_start?: number
          id?: string
          is_active?: boolean
          max_ai_agents?: number
          max_users?: number
          max_workspaces?: number
          name: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          currency?: string
          data_retention_days?: number
          feature_flags?: Json
          fiscal_year_start?: number
          id?: string
          is_active?: boolean
          max_ai_agents?: number
          max_users?: number
          max_workspaces?: number
          name?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          amount_applied: number
          created_at: string
          document_id: string
          document_type: string
          id: string
          payment_id: string
        }
        Insert: {
          amount_applied: number
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          payment_id: string
        }
        Update: {
          amount_applied?: number
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_payment_id_payments_id_fk"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          contact_id: string
          created_at: string
          currency_code: string
          direction: string
          exchange_rate: number | null
          id: string
          journal_entry_id: string | null
          memo: string | null
          method: Database["public"]["Enums"]["payment_method"]
          organization_id: string
          payment_date: string
          payment_number: string
          reference_number: string | null
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          contact_id: string
          created_at?: string
          currency_code?: string
          direction: string
          exchange_rate?: number | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          organization_id: string
          payment_date: string
          payment_number: string
          reference_number?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          contact_id?: string
          created_at?: string
          currency_code?: string
          direction?: string
          exchange_rate?: number | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          organization_id?: string
          payment_date?: string
          payment_number?: string
          reference_number?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_bank_account_id_chart_accounts_id_fk"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contact_id_contacts_id_fk"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_journal_entry_id_journal_entries_id_fk"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          currency_code: string
          custom_fields: Json | null
          description: string | null
          expense_account_id: string | null
          id: string
          income_account_id: string | null
          inventory_account_id: string | null
          is_active: boolean
          is_service: boolean
          is_taxable: boolean
          is_tracked_inventory: boolean
          name: string
          organization_id: string
          preferred_vendor_id: string | null
          purchase_price: number | null
          quantity_on_hand: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          sale_price: number | null
          sku: string
          tax_code_id: string | null
          unit_of_measure: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency_code?: string
          custom_fields?: Json | null
          description?: string | null
          expense_account_id?: string | null
          id?: string
          income_account_id?: string | null
          inventory_account_id?: string | null
          is_active?: boolean
          is_service?: boolean
          is_taxable?: boolean
          is_tracked_inventory?: boolean
          name: string
          organization_id: string
          preferred_vendor_id?: string | null
          purchase_price?: number | null
          quantity_on_hand?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          sale_price?: number | null
          sku: string
          tax_code_id?: string | null
          unit_of_measure?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency_code?: string
          custom_fields?: Json | null
          description?: string | null
          expense_account_id?: string | null
          id?: string
          income_account_id?: string | null
          inventory_account_id?: string | null
          is_active?: boolean
          is_service?: boolean
          is_taxable?: boolean
          is_tracked_inventory?: boolean
          name?: string
          organization_id?: string
          preferred_vendor_id?: string | null
          purchase_price?: number | null
          quantity_on_hand?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          sale_price?: number | null
          sku?: string
          tax_code_id?: string | null
          unit_of_measure?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_expense_account_id_chart_accounts_id_fk"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_income_account_id_chart_accounts_id_fk"
            columns: ["income_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_inventory_account_id_chart_accounts_id_fk"
            columns: ["inventory_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_preferred_vendor_id_contacts_id_fk"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          expires: string
          id: string
          organization_id: string | null
          session_token: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          expires: string
          id?: string
          organization_id?: string | null
          session_token: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          expires?: string
          id?: string
          organization_id?: string | null
          session_token?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_User_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      Stream: {
        Row: {
          chatId: string
          createdAt: string
          id: string
        }
        Insert: {
          chatId: string
          createdAt: string
          id?: string
        }
        Update: {
          chatId?: string
          createdAt?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Stream_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
        ]
      }
      Suggestion: {
        Row: {
          createdAt: string
          description: string | null
          documentCreatedAt: string
          documentId: string
          id: string
          isResolved: boolean
          originalText: string
          suggestedText: string
          userId: string
        }
        Insert: {
          createdAt: string
          description?: string | null
          documentCreatedAt: string
          documentId: string
          id?: string
          isResolved?: boolean
          originalText: string
          suggestedText: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          documentCreatedAt?: string
          documentId?: string
          id?: string
          isResolved?: boolean
          originalText?: string
          suggestedText?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f"
            columns: ["documentId", "documentCreatedAt"]
            isOneToOne: false
            referencedRelation: "Document"
            referencedColumns: ["id", "createdAt"]
          },
          {
            foreignKeyName: "Suggestion_userId_User_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_purchase: boolean
          is_sales: boolean
          organization_id: string
          purchase_account_id: string | null
          rate_percent: number
          sales_account_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_purchase?: boolean
          is_sales?: boolean
          organization_id: string
          purchase_account_id?: string | null
          rate_percent?: number
          sales_account_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_purchase?: boolean
          is_sales?: boolean
          organization_id?: string
          purchase_account_id?: string | null
          rate_percent?: number
          sales_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_codes_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_codes_purchase_account_id_chart_accounts_id_fk"
            columns: ["purchase_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_codes_sales_account_id_chart_accounts_id_fk"
            columns: ["sales_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          created_at: string
          current_organization_id: string | null
          current_workspace_id: string | null
          display_name: string | null
          email: string
          email_verified: string | null
          id: string
          image: string | null
          is_active: boolean
          last_active_at: string | null
          metadata: Json | null
          name: string | null
          password: string | null
          preferences: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_organization_id?: string | null
          current_workspace_id?: string | null
          display_name?: string | null
          email: string
          email_verified?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          last_active_at?: string | null
          metadata?: Json | null
          name?: string | null
          password?: string | null
          preferences?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_organization_id?: string | null
          current_workspace_id?: string | null
          display_name?: string | null
          email?: string
          email_verified?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          last_active_at?: string | null
          metadata?: Json | null
          name?: string | null
          password?: string | null
          preferences?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_current_organization_id_organizations_id_fk"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User_current_workspace_id_workspaces_id_fk"
            columns: ["current_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      Vote: {
        Row: {
          chatId: string
          isUpvoted: boolean
          messageId: string
        }
        Insert: {
          chatId: string
          isUpvoted: boolean
          messageId: string
        }
        Update: {
          chatId?: string
          isUpvoted?: boolean
          messageId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Vote_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Vote_messageId_Message_id_fk"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "Message"
            referencedColumns: ["id"]
          },
        ]
      }
      Vote_v2: {
        Row: {
          chatId: string
          isUpvoted: boolean
          messageId: string
        }
        Insert: {
          chatId: string
          isUpvoted: boolean
          messageId: string
        }
        Update: {
          chatId?: string
          isUpvoted?: boolean
          messageId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Vote_v2_chatId_Chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "Chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Vote_v2_messageId_Message_v2_id_fk"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "Message_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          organization_id: string
          parent_workspace_id: string | null
          settings: Json
          slug: string
          updated_at: string
          workspace_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          organization_id: string
          parent_workspace_id?: string | null
          settings?: Json
          slug: string
          updated_at?: string
          workspace_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          organization_id?: string
          parent_workspace_id?: string | null
          settings?: Json
          slug?: string
          updated_at?: string
          workspace_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_parent_workspace_id_workspaces_id_fk"
            columns: ["parent_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_workspace_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      set_auth_context: {
        Args: {
          p_org_id: string
          p_role?: string
          p_user_id: string
          p_workspace_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type:
        | "asset"
        | "liability"
        | "equity"
        | "income"
        | "expense"
        | "contra_asset"
        | "contra_liability"
        | "other"
      agent_status: "active" | "paused" | "disabled" | "error" | "configuring"
      agent_type:
        | "assistant"
        | "accountant"
        | "analyst"
        | "scheduler"
        | "customer_service"
        | "sales"
        | "data_processor"
        | "custom"
      bill_status:
        | "draft"
        | "received"
        | "approved"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "disputed"
        | "cancelled"
        | "void"
      contact_type:
        | "customer"
        | "vendor"
        | "customer_vendor"
        | "employee"
        | "other"
      entry_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "posted"
        | "void"
        | "reversed"
      execution_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
        | "timeout"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
        | "void"
      journal_type:
        | "general"
        | "sales"
        | "purchases"
        | "cash_receipts"
        | "cash_disbursements"
        | "inventory"
        | "payroll"
        | "adjusting"
        | "closing"
        | "other"
      llm_model:
        | "gpt-4-turbo"
        | "gpt-4"
        | "gpt-3.5-turbo"
        | "claude-3-opus"
        | "claude-3-sonnet"
        | "claude-3-haiku"
        | "gemini-pro"
        | "llama-2-70b"
        | "mistral-large"
        | "custom"
      payment_method:
        | "cash"
        | "check"
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "ach"
        | "wire"
        | "paypal"
        | "stripe"
        | "other"
      plan_tier: "starter" | "professional" | "enterprise" | "custom"
      user_role:
        | "owner"
        | "admin"
        | "manager"
        | "accountant"
        | "employee"
        | "viewer"
        | "ai_agent"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: [
        "asset",
        "liability",
        "equity",
        "income",
        "expense",
        "contra_asset",
        "contra_liability",
        "other",
      ],
      agent_status: ["active", "paused", "disabled", "error", "configuring"],
      agent_type: [
        "assistant",
        "accountant",
        "analyst",
        "scheduler",
        "customer_service",
        "sales",
        "data_processor",
        "custom",
      ],
      bill_status: [
        "draft",
        "received",
        "approved",
        "partially_paid",
        "paid",
        "overdue",
        "disputed",
        "cancelled",
        "void",
      ],
      contact_type: [
        "customer",
        "vendor",
        "customer_vendor",
        "employee",
        "other",
      ],
      entry_status: [
        "draft",
        "pending_approval",
        "approved",
        "posted",
        "void",
        "reversed",
      ],
      execution_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
        "timeout",
      ],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
        "void",
      ],
      journal_type: [
        "general",
        "sales",
        "purchases",
        "cash_receipts",
        "cash_disbursements",
        "inventory",
        "payroll",
        "adjusting",
        "closing",
        "other",
      ],
      llm_model: [
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
        "claude-3-opus",
        "claude-3-sonnet",
        "claude-3-haiku",
        "gemini-pro",
        "llama-2-70b",
        "mistral-large",
        "custom",
      ],
      payment_method: [
        "cash",
        "check",
        "credit_card",
        "debit_card",
        "bank_transfer",
        "ach",
        "wire",
        "paypal",
        "stripe",
        "other",
      ],
      plan_tier: ["starter", "professional", "enterprise", "custom"],
      user_role: [
        "owner",
        "admin",
        "manager",
        "accountant",
        "employee",
        "viewer",
        "ai_agent",
      ],
    },
  },
} as const


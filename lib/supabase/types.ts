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
      agent_audit_trail: {
        Row: {
          action: string
          action_type: string
          affected_accounts: Json | null
          agent_id: string | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          business_context: Json | null
          changed_fields: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          error_message: string | null
          execution_id: string | null
          financial_impact: number | null
          id: string
          ip_address: string | null
          new_data: Json | null
          organization_id: string
          previous_data: Json | null
          reason: string | null
          required_approval: boolean
          risk_factors: Json | null
          risk_level: string | null
          session_id: string | null
          sql_query: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          action: string
          action_type: string
          affected_accounts?: Json | null
          agent_id?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_context?: Json | null
          changed_fields?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          execution_id?: string | null
          financial_impact?: number | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          organization_id: string
          previous_data?: Json | null
          reason?: string | null
          required_approval?: boolean
          risk_factors?: Json | null
          risk_level?: string | null
          session_id?: string | null
          sql_query?: string | null
          status: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          action_type?: string
          affected_accounts?: Json | null
          agent_id?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_context?: Json | null
          changed_fields?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          execution_id?: string | null
          financial_impact?: number | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          organization_id?: string
          previous_data?: Json | null
          reason?: string | null
          required_approval?: boolean
          risk_factors?: Json | null
          risk_level?: string | null
          session_id?: string | null
          sql_query?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_audit_trail_agent_id_ai_agents_id_fk"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_audit_trail_approved_by_User_id_fk"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_audit_trail_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      agent_erp_permissions: {
        Row: {
          agent_id: string
          allowed_days: Json | null
          allowed_fields: Json | null
          allowed_hours: Json | null
          approval_threshold: number | null
          approver_roles: Json | null
          conditions: Json | null
          created_at: string
          denied_fields: Json | null
          description: string | null
          entity_types: Json | null
          id: string
          is_active: boolean
          max_daily_volume: number | null
          max_records_per_query: number | null
          max_transaction_amount: number | null
          operations: Json | null
          organization_id: string
          permission_name: string
          requires_approval: boolean
          scope: Database["public"]["Enums"]["permission_scope"]
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          agent_id: string
          allowed_days?: Json | null
          allowed_fields?: Json | null
          allowed_hours?: Json | null
          approval_threshold?: number | null
          approver_roles?: Json | null
          conditions?: Json | null
          created_at?: string
          denied_fields?: Json | null
          description?: string | null
          entity_types?: Json | null
          id?: string
          is_active?: boolean
          max_daily_volume?: number | null
          max_records_per_query?: number | null
          max_transaction_amount?: number | null
          operations?: Json | null
          organization_id: string
          permission_name: string
          requires_approval?: boolean
          scope: Database["public"]["Enums"]["permission_scope"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          agent_id?: string
          allowed_days?: Json | null
          allowed_fields?: Json | null
          allowed_hours?: Json | null
          approval_threshold?: number | null
          approver_roles?: Json | null
          conditions?: Json | null
          created_at?: string
          denied_fields?: Json | null
          description?: string | null
          entity_types?: Json | null
          id?: string
          is_active?: boolean
          max_daily_volume?: number | null
          max_records_per_query?: number | null
          max_transaction_amount?: number | null
          operations?: Json | null
          organization_id?: string
          permission_name?: string
          requires_approval?: boolean
          scope?: Database["public"]["Enums"]["permission_scope"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_erp_permissions_agent_id_ai_agents_id_fk"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_erp_permissions_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          allow_deposits: boolean
          allow_payments: boolean
          available_balance: number
          bank_account_type: Database["public"]["Enums"]["bank_account_type"]
          bank_branch: string | null
          bank_feed_credentials: Json | null
          bank_feed_enabled: boolean
          bank_feed_provider: string | null
          bank_name: string | null
          created_at: string
          currency_code: string
          current_balance: number
          gl_account_id: string
          iban: string | null
          id: string
          is_active: boolean
          is_default: boolean
          last_reconciled_balance: number | null
          last_reconciled_date: string | null
          last_synced_at: string | null
          organization_id: string
          require_reconciliation: boolean
          routing_number: string | null
          swift_code: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          account_name: string
          account_number?: string | null
          allow_deposits?: boolean
          allow_payments?: boolean
          available_balance?: number
          bank_account_type: Database["public"]["Enums"]["bank_account_type"]
          bank_branch?: string | null
          bank_feed_credentials?: Json | null
          bank_feed_enabled?: boolean
          bank_feed_provider?: string | null
          bank_name?: string | null
          created_at?: string
          currency_code: string
          current_balance?: number
          gl_account_id: string
          iban?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_reconciled_balance?: number | null
          last_reconciled_date?: string | null
          last_synced_at?: string | null
          organization_id: string
          require_reconciliation?: boolean
          routing_number?: string | null
          swift_code?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string | null
          allow_deposits?: boolean
          allow_payments?: boolean
          available_balance?: number
          bank_account_type?: Database["public"]["Enums"]["bank_account_type"]
          bank_branch?: string | null
          bank_feed_credentials?: Json | null
          bank_feed_enabled?: boolean
          bank_feed_provider?: string | null
          bank_name?: string | null
          created_at?: string
          currency_code?: string
          current_balance?: number
          gl_account_id?: string
          iban?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_reconciled_balance?: number | null
          last_reconciled_date?: string | null
          last_synced_at?: string | null
          organization_id?: string
          require_reconciliation?: boolean
          routing_number?: string | null
          swift_code?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_currency_code_currencies_code_fk"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "bank_accounts_gl_account_id_chart_accounts_id_fk"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliations: {
        Row: {
          adjustments: number
          approved_at: string | null
          approved_by: string | null
          bank_account_id: string
          cleared_deposits: number
          cleared_transaction_ids: Json | null
          cleared_withdrawals: number
          created_at: string
          difference: number
          end_date: string
          gl_beginning_balance: number
          gl_ending_balance: number
          id: string
          notes: string | null
          organization_id: string
          outstanding_deposits: number
          outstanding_transaction_ids: Json | null
          outstanding_withdrawals: number
          prepared_at: string | null
          prepared_by: string | null
          start_date: string
          statement_beginning_balance: number
          statement_date: string
          statement_ending_balance: number
          status: Database["public"]["Enums"]["reconciliation_status"]
          updated_at: string
        }
        Insert: {
          adjustments?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id: string
          cleared_deposits?: number
          cleared_transaction_ids?: Json | null
          cleared_withdrawals?: number
          created_at?: string
          difference?: number
          end_date: string
          gl_beginning_balance: number
          gl_ending_balance: number
          id?: string
          notes?: string | null
          organization_id: string
          outstanding_deposits?: number
          outstanding_transaction_ids?: Json | null
          outstanding_withdrawals?: number
          prepared_at?: string | null
          prepared_by?: string | null
          start_date: string
          statement_beginning_balance: number
          statement_date: string
          statement_ending_balance: number
          status?: Database["public"]["Enums"]["reconciliation_status"]
          updated_at?: string
        }
        Update: {
          adjustments?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string
          cleared_deposits?: number
          cleared_transaction_ids?: Json | null
          cleared_withdrawals?: number
          created_at?: string
          difference?: number
          end_date?: string
          gl_beginning_balance?: number
          gl_ending_balance?: number
          id?: string
          notes?: string | null
          organization_id?: string
          outstanding_deposits?: number
          outstanding_transaction_ids?: Json | null
          outstanding_withdrawals?: number
          prepared_at?: string | null
          prepared_by?: string | null
          start_date?: string
          statement_beginning_balance?: number
          statement_date?: string
          statement_ending_balance?: number
          status?: Database["public"]["Enums"]["reconciliation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_approved_by_User_id_fk"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_bank_account_id_bank_accounts_id_fk"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliations_prepared_by_User_id_fk"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_rules: {
        Row: {
          actions: Json
          bank_account_ids: Json | null
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_matched_at: string | null
          match_count: number
          organization_id: string
          priority: number
          rule_name: string
          stop_on_match: boolean
          updated_at: string
        }
        Insert: {
          actions: Json
          bank_account_ids?: Json | null
          conditions: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_matched_at?: string | null
          match_count?: number
          organization_id: string
          priority?: number
          rule_name: string
          stop_on_match?: boolean
          updated_at?: string
        }
        Update: {
          actions?: Json
          bank_account_ids?: Json | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_matched_at?: string | null
          match_count?: number
          organization_id?: string
          priority?: number
          rule_name?: string
          stop_on_match?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_rules_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_rules_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          bank_reference_number: string | null
          category: string | null
          check_number: string | null
          created_at: string
          description: string | null
          id: string
          import_batch_id: string | null
          is_duplicate: boolean
          is_reconciled: boolean
          journal_entry_id: string | null
          memo: string | null
          organization_id: string
          payee: string | null
          payment_id: string | null
          reconciled_date: string | null
          reconciliation_id: string | null
          running_balance: number | null
          tags: Json | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["bank_transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          bank_reference_number?: string | null
          category?: string | null
          check_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          import_batch_id?: string | null
          is_duplicate?: boolean
          is_reconciled?: boolean
          journal_entry_id?: string | null
          memo?: string | null
          organization_id: string
          payee?: string | null
          payment_id?: string | null
          reconciled_date?: string | null
          reconciliation_id?: string | null
          running_balance?: number | null
          tags?: Json | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["bank_transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          bank_reference_number?: string | null
          category?: string | null
          check_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          import_batch_id?: string | null
          is_duplicate?: boolean
          is_reconciled?: boolean
          journal_entry_id?: string | null
          memo?: string | null
          organization_id?: string
          payee?: string | null
          payment_id?: string | null
          reconciled_date?: string | null
          reconciliation_id?: string | null
          running_balance?: number | null
          tags?: Json | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["bank_transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_bank_accounts_id_fk"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_journal_entry_id_journal_entries_id_fk"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_payment_id_payments_id_fk"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_reconciliation_id_bank_reconciliations_id_fk"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
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
      budget_rules: {
        Row: {
          alert_threshold: number | null
          budget_amount: number
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string
          period: Database["public"]["Enums"]["budget_period"] | null
          rollover: boolean | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          alert_threshold?: number | null
          budget_amount: number
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          period?: Database["public"]["Enums"]["budget_period"] | null
          rollover?: boolean | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          alert_threshold?: number | null
          budget_amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          period?: Database["public"]["Enums"]["budget_period"] | null
          rollover?: boolean | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_rules_category_id_personal_categories_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "personal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_rules_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_rules_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_metrics: {
        Row: {
          aggregation_method: string | null
          business_context: string | null
          calculation_type: string
          category: string
          created_at: string
          critical_threshold: number | null
          decimal_places: number | null
          depends_on: Json | null
          description: string | null
          display_format: string | null
          formula: string | null
          group_by_fields: Json | null
          id: string
          improvement_tips: Json | null
          is_active: boolean
          is_kpi: boolean
          last_calculated_at: string | null
          last_calculated_value: number | null
          metric_code: string
          metric_name: string
          organization_id: string | null
          prefix: string | null
          refresh_frequency: string | null
          rolling_window: number | null
          sql_query: string | null
          suffix: string | null
          target_value: number | null
          time_dimension: string | null
          updated_at: string
          warning_threshold: number | null
        }
        Insert: {
          aggregation_method?: string | null
          business_context?: string | null
          calculation_type: string
          category: string
          created_at?: string
          critical_threshold?: number | null
          decimal_places?: number | null
          depends_on?: Json | null
          description?: string | null
          display_format?: string | null
          formula?: string | null
          group_by_fields?: Json | null
          id?: string
          improvement_tips?: Json | null
          is_active?: boolean
          is_kpi?: boolean
          last_calculated_at?: string | null
          last_calculated_value?: number | null
          metric_code: string
          metric_name: string
          organization_id?: string | null
          prefix?: string | null
          refresh_frequency?: string | null
          rolling_window?: number | null
          sql_query?: string | null
          suffix?: string | null
          target_value?: number | null
          time_dimension?: string | null
          updated_at?: string
          warning_threshold?: number | null
        }
        Update: {
          aggregation_method?: string | null
          business_context?: string | null
          calculation_type?: string
          category?: string
          created_at?: string
          critical_threshold?: number | null
          decimal_places?: number | null
          depends_on?: Json | null
          description?: string | null
          display_format?: string | null
          formula?: string | null
          group_by_fields?: Json | null
          id?: string
          improvement_tips?: Json | null
          is_active?: boolean
          is_kpi?: boolean
          last_calculated_at?: string | null
          last_calculated_value?: number | null
          metric_code?: string
          metric_name?: string
          organization_id?: string | null
          prefix?: string | null
          refresh_frequency?: string | null
          rolling_window?: number | null
          sql_query?: string | null
          suffix?: string | null
          target_value?: number | null
          time_dimension?: string | null
          updated_at?: string
          warning_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_metrics_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_forecasts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          ending_balance: number
          forecast_items: Json
          forecast_name: string
          id: string
          include_weekends: boolean
          is_active: boolean
          minimum_balance: number | null
          minimum_balance_date: string | null
          organization_id: string
          scenario: string
          start_date: string
          starting_balance: number
          total_inflows: number
          total_outflows: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          ending_balance?: number
          forecast_items: Json
          forecast_name: string
          id?: string
          include_weekends?: boolean
          is_active?: boolean
          minimum_balance?: number | null
          minimum_balance_date?: string | null
          organization_id: string
          scenario?: string
          start_date: string
          starting_balance: number
          total_inflows?: number
          total_outflows?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          ending_balance?: number
          forecast_items?: Json
          forecast_name?: string
          id?: string
          include_weekends?: boolean
          is_active?: boolean
          minimum_balance?: number | null
          minimum_balance_date?: string | null
          organization_id?: string
          scenario?: string
          start_date?: string
          starting_balance?: number
          total_inflows?: number
          total_outflows?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_forecasts_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_forecasts_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          created_at: string
          decimals: number
          is_active: boolean
          name: string
          organization_id: string
          symbol: string
        }
        Insert: {
          code: string
          created_at?: string
          decimals?: number
          is_active?: boolean
          name: string
          organization_id: string
          symbol: string
        }
        Update: {
          code?: string
          created_at?: string
          decimals?: number
          is_active?: boolean
          name?: string
          organization_id?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "currencies_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      document_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          context: Json | null
          document_id: string
          id: string
          ip_address: string | null
          organization_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string
          context?: Json | null
          document_id: string
          id?: string
          ip_address?: string | null
          organization_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string
          context?: Json | null
          document_id?: string
          id?: string
          ip_address?: string | null
          organization_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_logs_document_id_documents_id_fk"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_logs_user_id_User_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          category: string | null
          chunk_count: number
          chunk_index: number
          content: string
          content_hash: string | null
          created_at: string
          document_id: string
          document_type: Database["public"]["Enums"]["document_type"] | null
          embedding: string | null
          id: string
          metadata: Json
          organization_id: string
          search_text: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          chunk_count?: number
          chunk_index?: number
          content: string
          content_hash?: string | null
          created_at?: string
          document_id: string
          document_type?: Database["public"]["Enums"]["document_type"] | null
          embedding?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          search_text?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          chunk_count?: number
          chunk_index?: number
          content?: string
          content_hash?: string | null
          created_at?: string
          document_id?: string
          document_type?: Database["public"]["Enums"]["document_type"] | null
          embedding?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          search_text?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_documents_id_fk"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_embeddings_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_embeddings_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_processing_jobs: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          current_step: number | null
          document_id: string
          duration: number | null
          error: string | null
          id: string
          job_type: string
          organization_id: string
          progress: number | null
          result: Json | null
          started_at: string | null
          status: string
          total_steps: number | null
        }
        Insert: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          current_step?: number | null
          document_id: string
          duration?: number | null
          error?: string | null
          id?: string
          job_type: string
          organization_id: string
          progress?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          total_steps?: number | null
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          current_step?: number | null
          document_id?: string
          duration?: number | null
          error?: string | null
          id?: string
          job_type?: string
          organization_id?: string
          progress?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          total_steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_processing_jobs_document_id_documents_id_fk"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_processing_jobs_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          allowed_users: Json | null
          auto_tags: Json | null
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          extracted_text: string | null
          file_name: string
          file_size: number
          file_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_public: boolean
          language: string | null
          metadata: Json
          mime_type: string | null
          organization_id: string
          processed_at: string | null
          processing_error: string | null
          related_bill_id: string | null
          related_contract_id: string | null
          related_invoice_id: string | null
          search_text: string | null
          status: Database["public"]["Enums"]["document_status"]
          storage_bucket: string
          storage_key: string
          storage_url: string
          tags: Json | null
          text_length: number | null
          title: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          allowed_users?: Json | null
          auto_tags?: Json | null
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          extracted_text?: string | null
          file_name: string
          file_size: number
          file_type: Database["public"]["Enums"]["document_type"]
          id?: string
          is_public?: boolean
          language?: string | null
          metadata?: Json
          mime_type?: string | null
          organization_id: string
          processed_at?: string | null
          processing_error?: string | null
          related_bill_id?: string | null
          related_contract_id?: string | null
          related_invoice_id?: string | null
          search_text?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_bucket?: string
          storage_key: string
          storage_url: string
          tags?: Json | null
          text_length?: number | null
          title: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          allowed_users?: Json | null
          auto_tags?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          extracted_text?: string | null
          file_name?: string
          file_size?: number
          file_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_public?: boolean
          language?: string | null
          metadata?: Json
          mime_type?: string | null
          organization_id?: string
          processed_at?: string | null
          processing_error?: string | null
          related_bill_id?: string | null
          related_contract_id?: string | null
          related_invoice_id?: string | null
          search_text?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_bucket?: string
          storage_key?: string
          storage_url?: string
          tags?: Json | null
          text_length?: number | null
          title?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_automation_rules: {
        Row: {
          actions: Json
          agent_id: string | null
          category: string | null
          conditions: Json | null
          cooldown_minutes: number | null
          created_at: string
          created_by: string | null
          description: string | null
          execution_count: number
          failure_count: number
          id: string
          is_active: boolean
          last_executed_at: string | null
          last_status: string | null
          max_executions_per_day: number | null
          max_retries: number | null
          notification_emails: Json | null
          notify_on_failure: boolean
          notify_on_success: boolean
          organization_id: string
          retry_on_failure: boolean
          rule_name: string
          success_count: number
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
          updated_at: string
        }
        Insert: {
          actions: Json
          agent_id?: string | null
          category?: string | null
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number
          failure_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          last_status?: string | null
          max_executions_per_day?: number | null
          max_retries?: number | null
          notification_emails?: Json | null
          notify_on_failure?: boolean
          notify_on_success?: boolean
          organization_id: string
          retry_on_failure?: boolean
          rule_name: string
          success_count?: number
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Update: {
          actions?: Json
          agent_id?: string | null
          category?: string | null
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number
          failure_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          last_status?: string | null
          max_executions_per_day?: number | null
          max_retries?: number | null
          notification_emails?: Json | null
          notify_on_failure?: boolean
          notify_on_success?: boolean
          organization_id?: string
          retry_on_failure?: boolean
          rule_name?: string
          success_count?: number
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_automation_rules_agent_id_ai_agents_id_fk"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_automation_rules_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_automation_rules_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      financial_goals: {
        Row: {
          allocation_amount: number | null
          allocation_frequency: string | null
          auto_allocate: boolean | null
          completed_date: string | null
          created_at: string
          current_amount: number | null
          description: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          name: string
          organization_id: string
          priority: number | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_amount: number
          target_date: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allocation_amount?: number | null
          allocation_frequency?: string | null
          auto_allocate?: boolean | null
          completed_date?: string | null
          created_at?: string
          current_amount?: number | null
          description?: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id?: string
          name: string
          organization_id: string
          priority?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_amount: number
          target_date?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allocation_amount?: number | null
          allocation_frequency?: string | null
          auto_allocate?: boolean | null
          completed_date?: string | null
          created_at?: string
          current_amount?: number | null
          description?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          name?: string
          organization_id?: string
          priority?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_goals_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_guardrails: {
        Row: {
          allow_override: boolean
          category: string
          created_at: string
          description: string | null
          entity_type: string | null
          guardrail_name: string
          id: string
          is_active: boolean
          last_violation_at: string | null
          notification_recipients: Json | null
          notify_on_violation: boolean
          organization_id: string
          override_requires_reason: boolean
          override_roles: Json | null
          rules: Json
          updated_at: string
          violation_count: number
        }
        Insert: {
          allow_override?: boolean
          category: string
          created_at?: string
          description?: string | null
          entity_type?: string | null
          guardrail_name: string
          id?: string
          is_active?: boolean
          last_violation_at?: string | null
          notification_recipients?: Json | null
          notify_on_violation?: boolean
          organization_id: string
          override_requires_reason?: boolean
          override_roles?: Json | null
          rules: Json
          updated_at?: string
          violation_count?: number
        }
        Update: {
          allow_override?: boolean
          category?: string
          created_at?: string
          description?: string | null
          entity_type?: string | null
          guardrail_name?: string
          id?: string
          is_active?: boolean
          last_violation_at?: string | null
          notification_recipients?: Json | null
          notify_on_violation?: boolean
          organization_id?: string
          override_requires_reason?: boolean
          override_roles?: Json | null
          rules?: Json
          updated_at?: string
          violation_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_guardrails_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_lines: {
        Row: {
          created_at: string
          fulfillment_id: string
          id: string
          lot_number: string | null
          quantity_fulfilled: number
          sales_order_line_id: string
          serial_numbers: Json | null
        }
        Insert: {
          created_at?: string
          fulfillment_id: string
          id?: string
          lot_number?: string | null
          quantity_fulfilled: number
          sales_order_line_id: string
          serial_numbers?: Json | null
        }
        Update: {
          created_at?: string
          fulfillment_id?: string
          id?: string
          lot_number?: string | null
          quantity_fulfilled?: number
          sales_order_line_id?: string
          serial_numbers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_lines_fulfillment_id_order_fulfillments_id_fk"
            columns: ["fulfillment_id"]
            isOneToOne: false
            referencedRelation: "order_fulfillments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_lines_sales_order_line_id_sales_order_lines_id_fk"
            columns: ["sales_order_line_id"]
            isOneToOne: false
            referencedRelation: "sales_order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustment_lines: {
        Row: {
          adjustment_id: string
          adjustment_quantity: number
          created_at: string
          current_quantity: number
          id: string
          line_number: number
          lot_number: string | null
          new_quantity: number
          notes: string | null
          product_id: string
          serial_number: string | null
          total_value_change: number | null
          unit_cost: number | null
        }
        Insert: {
          adjustment_id: string
          adjustment_quantity: number
          created_at?: string
          current_quantity: number
          id?: string
          line_number: number
          lot_number?: string | null
          new_quantity: number
          notes?: string | null
          product_id: string
          serial_number?: string | null
          total_value_change?: number | null
          unit_cost?: number | null
        }
        Update: {
          adjustment_id?: string
          adjustment_quantity?: number
          created_at?: string
          current_quantity?: number
          id?: string
          line_number?: number
          lot_number?: string | null
          new_quantity?: number
          notes?: string | null
          product_id?: string
          serial_number?: string | null
          total_value_change?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustment_lines_adjustment_id_inventory_adjustments_"
            columns: ["adjustment_id"]
            isOneToOne: false
            referencedRelation: "inventory_adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustment_lines_product_id_products_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          adjustment_date: string
          adjustment_number: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          id: string
          organization_id: string
          posted_at: string | null
          reason: Database["public"]["Enums"]["adjustment_reason"]
          requested_by: string | null
          status: string
          stock_move_ids: Json | null
          total_items: number
          total_value_change: number | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          adjustment_date: string
          adjustment_number: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          posted_at?: string | null
          reason: Database["public"]["Enums"]["adjustment_reason"]
          requested_by?: string | null
          status?: string
          stock_move_ids?: Json | null
          total_items?: number
          total_value_change?: number | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          adjustment_date?: string
          adjustment_number?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          posted_at?: string | null
          reason?: Database["public"]["Enums"]["adjustment_reason"]
          requested_by?: string | null
          status?: string
          stock_move_ids?: Json | null
          total_items?: number
          total_value_change?: number | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_approved_by_User_id_fk"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_requested_by_User_id_fk"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_warehouse_id_warehouses_id_fk"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_levels: {
        Row: {
          average_cost: number | null
          id: string
          last_counted_date: string | null
          last_purchase_cost: number | null
          last_received_date: string | null
          last_sold_date: string | null
          max_stock_level: number | null
          organization_id: string
          product_id: string
          quantity_available: number
          quantity_on_hand: number
          quantity_reserved: number
          reorder_point: number | null
          reorder_quantity: number | null
          total_value: number | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          average_cost?: number | null
          id?: string
          last_counted_date?: string | null
          last_purchase_cost?: number | null
          last_received_date?: string | null
          last_sold_date?: string | null
          max_stock_level?: number | null
          organization_id: string
          product_id: string
          quantity_available?: number
          quantity_on_hand?: number
          quantity_reserved?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          total_value?: number | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          average_cost?: number | null
          id?: string
          last_counted_date?: string | null
          last_purchase_cost?: number | null
          last_received_date?: string | null
          last_sold_date?: string | null
          max_stock_level?: number | null
          organization_id?: string
          product_id?: string
          quantity_available?: number
          quantity_on_hand?: number
          quantity_reserved?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          total_value?: number | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_product_id_products_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_warehouse_id_warehouses_id_fk"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_holdings: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          cost_basis: number
          created_at: string
          current_price: number | null
          id: string
          investment_account_id: string | null
          last_updated: string | null
          market_value: number | null
          name: string
          organization_id: string
          quantity: number
          symbol: string
          unrealized_gain_loss: number | null
          workspace_id: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          cost_basis: number
          created_at?: string
          current_price?: number | null
          id?: string
          investment_account_id?: string | null
          last_updated?: string | null
          market_value?: number | null
          name: string
          organization_id: string
          quantity: number
          symbol: string
          unrealized_gain_loss?: number | null
          workspace_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          cost_basis?: number
          created_at?: string
          current_price?: number | null
          id?: string
          investment_account_id?: string | null
          last_updated?: string | null
          market_value?: number | null
          name?: string
          organization_id?: string
          quantity?: number
          symbol?: string
          unrealized_gain_loss?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_investment_account_id_chart_accounts_id_fk"
            columns: ["investment_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
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
          is_balanced: boolean | null
          journal_id: string
          memo: string | null
          organization_id: string
          posted_at: string | null
          reversed_from_id: string | null
          status: Database["public"]["Enums"]["entry_status"]
          total_credits: number
          total_debits: number
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
          is_balanced?: boolean | null
          journal_id: string
          memo?: string | null
          organization_id: string
          posted_at?: string | null
          reversed_from_id?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          total_credits?: number
          total_debits?: number
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
          is_balanced?: boolean | null
          journal_id?: string
          memo?: string | null
          organization_id?: string
          posted_at?: string | null
          reversed_from_id?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          total_credits?: number
          total_debits?: number
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
          foreign_credit: number | null
          foreign_debit: number | null
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
          foreign_credit?: number | null
          foreign_debit?: number | null
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
          foreign_credit?: number | null
          foreign_debit?: number | null
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
      nl_mappings: {
        Row: {
          conditions: Json | null
          confidence_score: number | null
          context_required: Json | null
          created_at: string
          example_queries: Json | null
          id: string
          is_active: boolean
          mapping_type: string
          natural_phrase: string
          organization_id: string | null
          priority: number
          sql_fragment: string
          success_rate: number | null
          target_column: string | null
          target_table: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          conditions?: Json | null
          confidence_score?: number | null
          context_required?: Json | null
          created_at?: string
          example_queries?: Json | null
          id?: string
          is_active?: boolean
          mapping_type: string
          natural_phrase: string
          organization_id?: string | null
          priority?: number
          sql_fragment: string
          success_rate?: number | null
          target_column?: string | null
          target_table?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          conditions?: Json | null
          confidence_score?: number | null
          context_required?: Json | null
          created_at?: string
          example_queries?: Json | null
          id?: string
          is_active?: boolean
          mapping_type?: string
          natural_phrase?: string
          organization_id?: string | null
          priority?: number
          sql_fragment?: string
          success_rate?: number | null
          target_column?: string | null
          target_table?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "nl_mappings_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_fulfillments: {
        Row: {
          created_at: string
          created_by: string | null
          delivered_at: string | null
          fulfilled_by: string | null
          fulfillment_date: string
          fulfillment_number: string
          id: string
          notes: string | null
          organization_id: string
          sales_order_id: string
          shipped_at: string | null
          shipping_carrier: string | null
          shipping_cost: number | null
          shipping_method: string | null
          status: Database["public"]["Enums"]["fulfillment_status"]
          tracking_number: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          fulfilled_by?: string | null
          fulfillment_date: string
          fulfillment_number: string
          id?: string
          notes?: string | null
          organization_id: string
          sales_order_id: string
          shipped_at?: string | null
          shipping_carrier?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"]
          tracking_number?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          fulfilled_by?: string | null
          fulfillment_date?: string
          fulfillment_number?: string
          id?: string
          notes?: string | null
          organization_id?: string
          sales_order_id?: string
          shipped_at?: string | null
          shipping_carrier?: string | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["fulfillment_status"]
          tracking_number?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_fulfillments_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillments_fulfilled_by_User_id_fk"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillments_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillments_sales_order_id_sales_orders_id_fk"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_fulfillments_warehouse_id_warehouses_id_fk"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
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
          accounting_mode: Database["public"]["Enums"]["accounting_mode"]
          base_currency: string
          country_code: string | null
          created_at: string
          currency: string
          data_retention_days: number
          enforce_balance_on_post: boolean
          feature_flags: Json
          fiscal_year_start: number
          id: string
          is_active: boolean
          is_personal_finance: boolean | null
          max_ai_agents: number
          max_users: number
          max_workspaces: number
          name: string
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          require_approval_workflow: boolean
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          timezone: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          accounting_mode?: Database["public"]["Enums"]["accounting_mode"]
          base_currency?: string
          country_code?: string | null
          created_at?: string
          currency?: string
          data_retention_days?: number
          enforce_balance_on_post?: boolean
          feature_flags?: Json
          fiscal_year_start?: number
          id?: string
          is_active?: boolean
          is_personal_finance?: boolean | null
          max_ai_agents?: number
          max_users?: number
          max_workspaces?: number
          name: string
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          require_approval_workflow?: boolean
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          accounting_mode?: Database["public"]["Enums"]["accounting_mode"]
          base_currency?: string
          country_code?: string | null
          created_at?: string
          currency?: string
          data_retention_days?: number
          enforce_balance_on_post?: boolean
          feature_flags?: Json
          fiscal_year_start?: number
          id?: string
          is_active?: boolean
          is_personal_finance?: boolean | null
          max_ai_agents?: number
          max_users?: number
          max_workspaces?: number
          name?: string
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          require_approval_workflow?: boolean
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
      personal_categories: {
        Row: {
          color: string | null
          created_at: string
          default_account_id: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          parent_category_id: string | null
          tax_relevant: boolean | null
          typical_merchants: string[] | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          default_account_id?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          parent_category_id?: string | null
          tax_relevant?: boolean | null
          typical_merchants?: string[] | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          default_account_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_category_id?: string | null
          tax_relevant?: boolean | null
          typical_merchants?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_categories_default_account_id_chart_accounts_id_fk"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "chart_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_categories_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_categories_parent_category_id_personal_categories_id_f"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "personal_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_subscriptions: {
        Row: {
          amount: number
          cancellation_url: string | null
          category_id: string | null
          created_at: string
          frequency:
            | Database["public"]["Enums"]["subscription_frequency"]
            | null
          id: string
          is_active: boolean | null
          name: string
          next_billing_date: string | null
          notes: string | null
          organization_id: string
          updated_at: string
          vendor_name: string | null
          workspace_id: string
        }
        Insert: {
          amount: number
          cancellation_url?: string | null
          category_id?: string | null
          created_at?: string
          frequency?:
            | Database["public"]["Enums"]["subscription_frequency"]
            | null
          id?: string
          is_active?: boolean | null
          name: string
          next_billing_date?: string | null
          notes?: string | null
          organization_id: string
          updated_at?: string
          vendor_name?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          cancellation_url?: string | null
          category_id?: string | null
          created_at?: string
          frequency?:
            | Database["public"]["Enums"]["subscription_frequency"]
            | null
          id?: string
          is_active?: boolean | null
          name?: string
          next_billing_date?: string | null
          notes?: string | null
          organization_id?: string
          updated_at?: string
          vendor_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_subscriptions_category_id_personal_categories_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "personal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_subscriptions_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_subscriptions_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_field_registry: {
        Row: {
          allowed_roles: Json | null
          column_name: string
          created_at: string
          id: string
          masking_enabled: boolean
          masking_pattern: string | null
          notes: string | null
          pii_type: string
          regulations: Json | null
          requires_audit: boolean
          requires_encryption: boolean
          retention_days: number | null
          schema_name: string
          sensitivity_level: string
          table_name: string
          updated_at: string
        }
        Insert: {
          allowed_roles?: Json | null
          column_name: string
          created_at?: string
          id?: string
          masking_enabled?: boolean
          masking_pattern?: string | null
          notes?: string | null
          pii_type: string
          regulations?: Json | null
          requires_audit?: boolean
          requires_encryption?: boolean
          retention_days?: number | null
          schema_name: string
          sensitivity_level: string
          table_name: string
          updated_at?: string
        }
        Update: {
          allowed_roles?: Json | null
          column_name?: string
          created_at?: string
          id?: string
          masking_enabled?: boolean
          masking_pattern?: string | null
          notes?: string | null
          pii_type?: string
          regulations?: Json | null
          requires_audit?: boolean
          requires_encryption?: boolean
          retention_days?: number | null
          schema_name?: string
          sensitivity_level?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
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
      purchase_order_lines: {
        Row: {
          created_at: string
          description: string
          discount_amount: number | null
          discount_percent: number | null
          expected_receipt_date: string | null
          id: string
          line_number: number
          line_subtotal: number
          line_total: number
          notes: string | null
          product_id: string | null
          purchase_order_id: string
          quantity_billed: number
          quantity_cancelled: number
          quantity_ordered: number
          quantity_received: number
          tax_amount: number | null
          tax_code_id: string | null
          tax_rate: number | null
          unit_price: number
          vendor_sku: string | null
        }
        Insert: {
          created_at?: string
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          expected_receipt_date?: string | null
          id?: string
          line_number: number
          line_subtotal: number
          line_total: number
          notes?: string | null
          product_id?: string | null
          purchase_order_id: string
          quantity_billed?: number
          quantity_cancelled?: number
          quantity_ordered: number
          quantity_received?: number
          tax_amount?: number | null
          tax_code_id?: string | null
          tax_rate?: number | null
          unit_price: number
          vendor_sku?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          expected_receipt_date?: string | null
          id?: string
          line_number?: number
          line_subtotal?: number
          line_total?: number
          notes?: string | null
          product_id?: string | null
          purchase_order_id?: string
          quantity_billed?: number
          quantity_cancelled?: number
          quantity_ordered?: number
          quantity_received?: number
          tax_amount?: number | null
          tax_code_id?: string | null
          tax_rate?: number | null
          unit_price?: number
          vendor_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_product_id_products_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_purchase_order_id_purchase_orders_id_fk"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_tax_code_id_tax_codes_id_fk"
            columns: ["tax_code_id"]
            isOneToOne: false
            referencedRelation: "tax_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_receipt_date: string | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          currency_code: string
          custom_fields: Json | null
          discount_amount: number | null
          exchange_rate: number | null
          expected_receipt_date: string | null
          id: string
          internal_notes: string | null
          order_date: string
          order_number: string
          organization_id: string
          payment_terms: number | null
          requested_by: string | null
          requisition_number: string | null
          sent_at: string | null
          sent_method: string | null
          ship_to_address_line1: string | null
          ship_to_address_line2: string | null
          ship_to_city: string | null
          ship_to_country: string | null
          ship_to_postal_code: string | null
          ship_to_state: string | null
          ship_to_warehouse_id: string | null
          shipping_amount: number | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          subtotal: number
          tax_amount: number | null
          total_amount: number
          total_quantity_billed: number
          total_quantity_ordered: number
          total_quantity_received: number
          updated_at: string
          vendor_id: string
          vendor_notes: string | null
          vendor_reference_number: string | null
          workspace_id: string | null
        }
        Insert: {
          actual_receipt_date?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          custom_fields?: Json | null
          discount_amount?: number | null
          exchange_rate?: number | null
          expected_receipt_date?: string | null
          id?: string
          internal_notes?: string | null
          order_date: string
          order_number: string
          organization_id: string
          payment_terms?: number | null
          requested_by?: string | null
          requisition_number?: string | null
          sent_at?: string | null
          sent_method?: string | null
          ship_to_address_line1?: string | null
          ship_to_address_line2?: string | null
          ship_to_city?: string | null
          ship_to_country?: string | null
          ship_to_postal_code?: string | null
          ship_to_state?: string | null
          ship_to_warehouse_id?: string | null
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          total_quantity_billed?: number
          total_quantity_ordered?: number
          total_quantity_received?: number
          updated_at?: string
          vendor_id: string
          vendor_notes?: string | null
          vendor_reference_number?: string | null
          workspace_id?: string | null
        }
        Update: {
          actual_receipt_date?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          custom_fields?: Json | null
          discount_amount?: number | null
          exchange_rate?: number | null
          expected_receipt_date?: string | null
          id?: string
          internal_notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string
          payment_terms?: number | null
          requested_by?: string | null
          requisition_number?: string | null
          sent_at?: string | null
          sent_method?: string | null
          ship_to_address_line1?: string | null
          ship_to_address_line2?: string | null
          ship_to_city?: string | null
          ship_to_country?: string | null
          ship_to_postal_code?: string | null
          ship_to_state?: string | null
          ship_to_warehouse_id?: string | null
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          total_quantity_billed?: number
          total_quantity_ordered?: number
          total_quantity_received?: number
          updated_at?: string
          vendor_id?: string
          vendor_notes?: string | null
          vendor_reference_number?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_User_id_fk"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_requested_by_User_id_fk"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_ship_to_warehouse_id_warehouses_id_fk"
            columns: ["ship_to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_contacts_id_fk"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          purchase_order_id: string
          quality_check_completed: boolean
          quality_check_notes: string | null
          quality_check_required: boolean
          receipt_date: string
          receipt_number: string
          received_by: string | null
          status: string
          updated_at: string
          vendor_delivery_note: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          purchase_order_id: string
          quality_check_completed?: boolean
          quality_check_notes?: string | null
          quality_check_required?: boolean
          receipt_date: string
          receipt_number: string
          received_by?: string | null
          status?: string
          updated_at?: string
          vendor_delivery_note?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          purchase_order_id?: string
          quality_check_completed?: boolean
          quality_check_notes?: string | null
          quality_check_required?: boolean
          receipt_date?: string
          receipt_number?: string
          received_by?: string | null
          status?: string
          updated_at?: string
          vendor_delivery_note?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_purchase_order_id_purchase_orders_id_fk"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_received_by_User_id_fk"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_warehouse_id_warehouses_id_fk"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      query_batch_jobs: {
        Row: {
          batch_id: string
          completed_at: string | null
          config: Json
          created_at: string
          errors: Json | null
          failed_queries: number
          id: string
          organization_id: string
          processed_queries: number
          processing_time: number | null
          results: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["batch_status"]
          total_queries: number
          trigger_reason: string | null
          triggered_by: string | null
        }
        Insert: {
          batch_id: string
          completed_at?: string | null
          config?: Json
          created_at?: string
          errors?: Json | null
          failed_queries?: number
          id?: string
          organization_id: string
          processed_queries?: number
          processing_time?: number | null
          results?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
          total_queries: number
          trigger_reason?: string | null
          triggered_by?: string | null
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          config?: Json
          created_at?: string
          errors?: Json | null
          failed_queries?: number
          id?: string
          organization_id?: string
          processed_queries?: number
          processing_time?: number | null
          results?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
          total_queries?: number
          trigger_reason?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "query_batch_jobs_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_batch_jobs_triggered_by_User_id_fk"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      query_evolution: {
        Row: {
          adaptation_reason: string
          context_similarity: number | null
          created_at: string
          execution_success: boolean
          execution_time: number | null
          feedback_loop: Json | null
          id: string
          new_context: string
          organization_id: string
          original_context: string
          parent_query_id: string
          query_modifications: Json
          result_quality: number | null
        }
        Insert: {
          adaptation_reason: string
          context_similarity?: number | null
          created_at?: string
          execution_success: boolean
          execution_time?: number | null
          feedback_loop?: Json | null
          id?: string
          new_context: string
          organization_id: string
          original_context: string
          parent_query_id: string
          query_modifications?: Json
          result_quality?: number | null
        }
        Update: {
          adaptation_reason?: string
          context_similarity?: number | null
          created_at?: string
          execution_success?: boolean
          execution_time?: number | null
          feedback_loop?: Json | null
          id?: string
          new_context?: string
          organization_id?: string
          original_context?: string
          parent_query_id?: string
          query_modifications?: Json
          result_quality?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "query_evolution_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_evolution_parent_query_id_query_intelligence_id_fk"
            columns: ["parent_query_id"]
            isOneToOne: false
            referencedRelation: "query_intelligence"
            referencedColumns: ["id"]
          },
        ]
      }
      query_feedback: {
        Row: {
          accuracy: number | null
          comments: string | null
          created_at: string
          id: string
          organization_id: string
          performance: number | null
          query_intelligence_id: string
          rating: number
          relevance: number | null
          session_context: Json | null
          suggested_improvements: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          comments?: string | null
          created_at?: string
          id?: string
          organization_id: string
          performance?: number | null
          query_intelligence_id: string
          rating: number
          relevance?: number | null
          session_context?: Json | null
          suggested_improvements?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          comments?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          performance?: number | null
          query_intelligence_id?: string
          rating?: number
          relevance?: number | null
          session_context?: Json | null
          suggested_improvements?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_feedback_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_feedback_query_intelligence_id_query_intelligence_id_fk"
            columns: ["query_intelligence_id"]
            isOneToOne: false
            referencedRelation: "query_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_feedback_user_id_User_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      query_intelligence: {
        Row: {
          adaptations: number
          avg_execution_time: number | null
          complexity: Database["public"]["Enums"]["query_complexity"]
          confidence_score: number
          context_embedding: string | null
          created_at: string
          execution_count: number
          first_seen: string
          id: string
          intent: Database["public"]["Enums"]["query_intent"]
          is_active: boolean
          last_used: string
          metadata: Json
          organization_id: string
          original_query: string
          query_embedding: string | null
          query_hash: string
          query_pattern: string
          similarity_searches: number
          success_rate: number
          tables_used: Json
          total_execution_time: number
          updated_at: string
          user_prompt: string | null
          workspace_id: string | null
        }
        Insert: {
          adaptations?: number
          avg_execution_time?: number | null
          complexity: Database["public"]["Enums"]["query_complexity"]
          confidence_score?: number
          context_embedding?: string | null
          created_at?: string
          execution_count?: number
          first_seen?: string
          id?: string
          intent: Database["public"]["Enums"]["query_intent"]
          is_active?: boolean
          last_used?: string
          metadata?: Json
          organization_id: string
          original_query: string
          query_embedding?: string | null
          query_hash: string
          query_pattern: string
          similarity_searches?: number
          success_rate?: number
          tables_used?: Json
          total_execution_time?: number
          updated_at?: string
          user_prompt?: string | null
          workspace_id?: string | null
        }
        Update: {
          adaptations?: number
          avg_execution_time?: number | null
          complexity?: Database["public"]["Enums"]["query_complexity"]
          confidence_score?: number
          context_embedding?: string | null
          created_at?: string
          execution_count?: number
          first_seen?: string
          id?: string
          intent?: Database["public"]["Enums"]["query_intent"]
          is_active?: boolean
          last_used?: string
          metadata?: Json
          organization_id?: string
          original_query?: string
          query_embedding?: string | null
          query_hash?: string
          query_pattern?: string
          similarity_searches?: number
          success_rate?: number
          tables_used?: Json
          total_execution_time?: number
          updated_at?: string
          user_prompt?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "query_intelligence_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_intelligence_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      query_patterns: {
        Row: {
          average_performance: number | null
          business_domain: string | null
          confidence_level: number
          created_at: string
          derived_from: Json | null
          id: string
          is_active: boolean
          organization_id: string
          parameters: Json
          pattern_description: string | null
          pattern_name: string
          pattern_template: string
          updated_at: string
          usage_count: number
          use_cases: Json | null
          version: number
        }
        Insert: {
          average_performance?: number | null
          business_domain?: string | null
          confidence_level?: number
          created_at?: string
          derived_from?: Json | null
          id?: string
          is_active?: boolean
          organization_id: string
          parameters?: Json
          pattern_description?: string | null
          pattern_name: string
          pattern_template: string
          updated_at?: string
          usage_count?: number
          use_cases?: Json | null
          version?: number
        }
        Update: {
          average_performance?: number | null
          business_domain?: string | null
          confidence_level?: number
          created_at?: string
          derived_from?: Json | null
          id?: string
          is_active?: boolean
          organization_id?: string
          parameters?: Json
          pattern_description?: string | null
          pattern_name?: string
          pattern_template?: string
          updated_at?: string
          usage_count?: number
          use_cases?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "query_patterns_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      query_templates: {
        Row: {
          allowed_users: Json | null
          avg_execution_time: number | null
          cache_duration: number | null
          category: string
          created_at: string
          estimated_runtime: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          organization_id: string | null
          output_columns: Json | null
          output_format: string
          parameters: Json
          question_examples: Json | null
          question_pattern: string
          required_role: string | null
          sql_template: string
          template_name: string
          updated_at: string
          usage_count: number
          validation_rules: Json | null
        }
        Insert: {
          allowed_users?: Json | null
          avg_execution_time?: number | null
          cache_duration?: number | null
          category: string
          created_at?: string
          estimated_runtime?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          organization_id?: string | null
          output_columns?: Json | null
          output_format?: string
          parameters: Json
          question_examples?: Json | null
          question_pattern: string
          required_role?: string | null
          sql_template: string
          template_name: string
          updated_at?: string
          usage_count?: number
          validation_rules?: Json | null
        }
        Update: {
          allowed_users?: Json | null
          avg_execution_time?: number | null
          cache_duration?: number | null
          category?: string
          created_at?: string
          estimated_runtime?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          organization_id?: string | null
          output_columns?: Json | null
          output_format?: string
          parameters?: Json
          question_examples?: Json | null
          question_pattern?: string
          required_role?: string | null
          sql_template?: string
          template_name?: string
          updated_at?: string
          usage_count?: number
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "query_templates_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      query_validation_rules: {
        Row: {
          action: string
          blocked_columns: Json | null
          blocked_keywords: Json | null
          blocked_tables: Json | null
          created_at: string
          description: string | null
          exempt_agents: Json | null
          exempt_users: Json | null
          id: string
          is_active: boolean
          max_execution_time: number | null
          max_joins: number | null
          max_rows_returned: number | null
          max_subqueries: number | null
          organization_id: string | null
          priority: number
          required_clauses: Json | null
          rule_name: string
          rule_type: string
          sql_patterns: Json | null
          updated_at: string
          warning_message: string | null
        }
        Insert: {
          action: string
          blocked_columns?: Json | null
          blocked_keywords?: Json | null
          blocked_tables?: Json | null
          created_at?: string
          description?: string | null
          exempt_agents?: Json | null
          exempt_users?: Json | null
          id?: string
          is_active?: boolean
          max_execution_time?: number | null
          max_joins?: number | null
          max_rows_returned?: number | null
          max_subqueries?: number | null
          organization_id?: string | null
          priority?: number
          required_clauses?: Json | null
          rule_name: string
          rule_type: string
          sql_patterns?: Json | null
          updated_at?: string
          warning_message?: string | null
        }
        Update: {
          action?: string
          blocked_columns?: Json | null
          blocked_keywords?: Json | null
          blocked_tables?: Json | null
          created_at?: string
          description?: string | null
          exempt_agents?: Json | null
          exempt_users?: Json | null
          id?: string
          is_active?: boolean
          max_execution_time?: number | null
          max_joins?: number | null
          max_rows_returned?: number | null
          max_subqueries?: number | null
          organization_id?: string | null
          priority?: number
          required_clauses?: Json | null
          rule_name?: string
          rule_type?: string
          sql_patterns?: Json | null
          updated_at?: string
          warning_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "query_validation_rules_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_lines: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          lot_number: string | null
          purchase_order_line_id: string
          quantity_accepted: number
          quantity_received: number
          quantity_rejected: number
          receipt_id: string
          rejection_reason: string | null
          serial_numbers: Json | null
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          lot_number?: string | null
          purchase_order_line_id: string
          quantity_accepted: number
          quantity_received: number
          quantity_rejected?: number
          receipt_id: string
          rejection_reason?: string | null
          serial_numbers?: Json | null
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          lot_number?: string | null
          purchase_order_line_id?: string
          quantity_accepted?: number
          quantity_received?: number
          quantity_rejected?: number
          receipt_id?: string
          rejection_reason?: string | null
          serial_numbers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_lines_purchase_order_line_id_purchase_order_lines_id_fk"
            columns: ["purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_lines_receipt_id_purchase_receipts_id_fk"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_lines: {
        Row: {
          created_at: string
          description: string
          discount_amount: number | null
          discount_percent: number | null
          expected_delivery_date: string | null
          id: string
          line_number: number
          line_subtotal: number
          line_total: number
          notes: string | null
          product_id: string | null
          quantity_cancelled: number
          quantity_fulfilled: number
          quantity_invoiced: number
          quantity_ordered: number
          sales_order_id: string
          tax_amount: number | null
          tax_code_id: string | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          expected_delivery_date?: string | null
          id?: string
          line_number: number
          line_subtotal: number
          line_total: number
          notes?: string | null
          product_id?: string | null
          quantity_cancelled?: number
          quantity_fulfilled?: number
          quantity_invoiced?: number
          quantity_ordered: number
          sales_order_id: string
          tax_amount?: number | null
          tax_code_id?: string | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          expected_delivery_date?: string | null
          id?: string
          line_number?: number
          line_subtotal?: number
          line_total?: number
          notes?: string | null
          product_id?: string | null
          quantity_cancelled?: number
          quantity_fulfilled?: number
          quantity_invoiced?: number
          quantity_ordered?: number
          sales_order_id?: string
          tax_amount?: number | null
          tax_code_id?: string | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_lines_product_id_products_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_lines_sales_order_id_sales_orders_id_fk"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_lines_tax_code_id_tax_codes_id_fk"
            columns: ["tax_code_id"]
            isOneToOne: false
            referencedRelation: "tax_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          actual_delivery_date: string | null
          approved_at: string | null
          approved_by: string | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          created_at: string
          created_by: string | null
          currency_code: string
          custom_fields: Json | null
          customer_id: string
          customer_notes: string | null
          customer_po_number: string | null
          discount_amount: number | null
          exchange_rate: number | null
          expected_delivery_date: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          internal_notes: string | null
          order_date: string
          order_number: string
          organization_id: string
          payment_terms: number | null
          sales_rep_id: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_amount: number | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["sales_order_status"]
          subtotal: number
          tax_amount: number | null
          total_amount: number
          total_quantity_fulfilled: number
          total_quantity_invoiced: number
          total_quantity_ordered: number
          updated_at: string
          warehouse_id: string | null
          workspace_id: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          custom_fields?: Json | null
          customer_id: string
          customer_notes?: string | null
          customer_po_number?: string | null
          discount_amount?: number | null
          exchange_rate?: number | null
          expected_delivery_date?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          internal_notes?: string | null
          order_date: string
          order_number: string
          organization_id: string
          payment_terms?: number | null
          sales_rep_id?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["sales_order_status"]
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          total_quantity_fulfilled?: number
          total_quantity_invoiced?: number
          total_quantity_ordered?: number
          updated_at?: string
          warehouse_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          custom_fields?: Json | null
          customer_id?: string
          customer_notes?: string | null
          customer_po_number?: string | null
          discount_amount?: number | null
          exchange_rate?: number | null
          expected_delivery_date?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          internal_notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string
          payment_terms?: number | null
          sales_rep_id?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["sales_order_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          total_quantity_fulfilled?: number
          total_quantity_invoiced?: number
          total_quantity_ordered?: number
          updated_at?: string
          warehouse_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_approved_by_User_id_fk"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_contacts_id_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_fulfilled_by_User_id_fk"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_sales_rep_id_User_id_fk"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_warehouse_id_warehouses_id_fk"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      semantic_catalog: {
        Row: {
          aliases: Json | null
          business_name: string
          calculation_logic: string | null
          category: string | null
          column_name: string | null
          common_questions: Json | null
          created_at: string
          data_type: string | null
          description: string | null
          id: string
          is_active: boolean
          is_pii: boolean
          is_sensitive: boolean
          object_name: string
          object_schema: string
          object_type: Database["public"]["Enums"]["catalog_object_type"]
          organization_id: string | null
          related_objects: Json | null
          required_role: string | null
          sql_examples: Json | null
          updated_at: string
        }
        Insert: {
          aliases?: Json | null
          business_name: string
          calculation_logic?: string | null
          category?: string | null
          column_name?: string | null
          common_questions?: Json | null
          created_at?: string
          data_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_pii?: boolean
          is_sensitive?: boolean
          object_name: string
          object_schema: string
          object_type: Database["public"]["Enums"]["catalog_object_type"]
          organization_id?: string | null
          related_objects?: Json | null
          required_role?: string | null
          sql_examples?: Json | null
          updated_at?: string
        }
        Update: {
          aliases?: Json | null
          business_name?: string
          calculation_logic?: string | null
          category?: string | null
          column_name?: string | null
          common_questions?: Json | null
          created_at?: string
          data_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_pii?: boolean
          is_sensitive?: boolean
          object_name?: string
          object_schema?: string
          object_type?: Database["public"]["Enums"]["catalog_object_type"]
          organization_id?: string | null
          related_objects?: Json | null
          required_role?: string | null
          sql_examples?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "semantic_catalog_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      stock_moves: {
        Row: {
          created_at: string
          created_by: string | null
          expiry_date: string | null
          from_warehouse_id: string | null
          id: string
          lot_number: string | null
          move_date: string
          move_number: string
          move_type: Database["public"]["Enums"]["stock_move_type"]
          notes: string | null
          organization_id: string
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          serial_number: string | null
          status: string
          to_warehouse_id: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          from_warehouse_id?: string | null
          id?: string
          lot_number?: string | null
          move_date: string
          move_number: string
          move_type: Database["public"]["Enums"]["stock_move_type"]
          notes?: string | null
          organization_id: string
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          serial_number?: string | null
          status?: string
          to_warehouse_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          from_warehouse_id?: string | null
          id?: string
          lot_number?: string | null
          move_date?: string
          move_number?: string
          move_type?: Database["public"]["Enums"]["stock_move_type"]
          notes?: string | null
          organization_id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          serial_number?: string | null
          status?: string
          to_warehouse_id?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_moves_created_by_User_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_from_warehouse_id_warehouses_id_fk"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_product_id_products_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_to_warehouse_id_warehouses_id_fk"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
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
      warehouses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          allow_negative_stock: boolean
          city: string | null
          code: string
          country: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          id: string
          is_active: boolean
          is_default: boolean
          manager_name: string | null
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          type: Database["public"]["Enums"]["warehouse_type"]
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          allow_negative_stock?: boolean
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          manager_name?: string | null
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["warehouse_type"]
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          allow_negative_stock?: boolean
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          manager_name?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["warehouse_type"]
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_organization_id_organizations_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_workspace_id_workspaces_id_fk"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_exchange_rate: {
        Args: {
          p_date?: string
          p_from_currency: string
          p_organization_id: string
          p_to_currency: string
        }
        Returns: number
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_valid_role: {
        Args: { role_name: string }
        Returns: boolean
      }
      is_valid_uuid: {
        Args: { input_text: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      set_auth_context: {
        Args: {
          p_org_id: string
          p_role?: string
          p_user_id: string
          p_workspace_id?: string
        }
        Returns: Json
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      validate_journal_balance: {
        Args: { p_enforce_mode?: string; p_journal_entry_id: string }
        Returns: Json
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      accounting_mode: "simple" | "standard" | "strict"
      adjustment_reason:
        | "cycle_count"
        | "physical_inventory"
        | "damaged"
        | "expired"
        | "lost"
        | "found"
        | "theft"
        | "data_correction"
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
      asset_type:
        | "stock"
        | "etf"
        | "mutual_fund"
        | "bond"
        | "crypto"
        | "commodity"
      automation_trigger:
        | "schedule"
        | "event"
        | "webhook"
        | "threshold"
        | "condition"
        | "manual"
      bank_account_type:
        | "checking"
        | "savings"
        | "credit_card"
        | "cash"
        | "loan"
        | "merchant"
        | "investment"
      bank_transaction_type:
        | "deposit"
        | "withdrawal"
        | "transfer"
        | "fee"
        | "interest"
        | "adjustment"
        | "opening_balance"
      batch_status: "pending" | "processing" | "completed" | "failed"
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
      budget_period: "weekly" | "monthly" | "quarterly" | "yearly"
      catalog_object_type:
        | "table"
        | "view"
        | "column"
        | "function"
        | "metric"
        | "business_term"
      contact_type:
        | "customer"
        | "vendor"
        | "customer_vendor"
        | "employee"
        | "other"
      document_status:
        | "uploaded"
        | "processing"
        | "processed"
        | "failed"
        | "archived"
      document_type:
        | "pdf"
        | "csv"
        | "xlsx"
        | "docx"
        | "txt"
        | "image"
        | "receipt"
        | "invoice"
        | "contract"
        | "statement"
        | "other"
      entry_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "posted"
        | "void"
        | "reversed"
      erp_operation:
        | "read"
        | "create"
        | "update"
        | "delete"
        | "approve"
        | "post"
        | "void"
        | "reconcile"
        | "export"
      execution_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
        | "timeout"
      fulfillment_status:
        | "pending"
        | "picking"
        | "packing"
        | "ready_to_ship"
        | "shipped"
        | "in_transit"
        | "delivered"
        | "returned"
        | "cancelled"
      goal_status: "active" | "paused" | "completed" | "cancelled"
      goal_type:
        | "savings"
        | "debt_payoff"
        | "investment"
        | "purchase"
        | "emergency_fund"
        | "retirement"
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
      organization_type: "business" | "personal" | "hybrid"
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
      permission_scope: "global" | "workspace" | "entity" | "record" | "field"
      plan_tier:
        | "starter"
        | "professional"
        | "enterprise"
        | "custom"
        | "personal-free"
        | "personal-plus"
        | "personal-pro"
        | "family"
      purchase_order_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "sent"
        | "acknowledged"
        | "partially_received"
        | "received"
        | "partially_billed"
        | "billed"
        | "completed"
        | "cancelled"
        | "on_hold"
      query_complexity: "simple" | "moderate" | "complex" | "advanced"
      query_intent:
        | "read"
        | "write"
        | "analyze"
        | "search"
        | "report"
        | "admin"
        | "unknown"
      reconciliation_status:
        | "draft"
        | "in_progress"
        | "completed"
        | "approved"
        | "void"
      sales_order_status:
        | "draft"
        | "pending"
        | "confirmed"
        | "in_fulfillment"
        | "partially_fulfilled"
        | "fulfilled"
        | "partially_invoiced"
        | "invoiced"
        | "completed"
        | "cancelled"
        | "on_hold"
      stock_move_type:
        | "purchase"
        | "sale"
        | "transfer"
        | "adjustment"
        | "production"
        | "return"
        | "damage"
        | "count"
      subscription_frequency: "weekly" | "monthly" | "quarterly" | "annual"
      user_role:
        | "owner"
        | "admin"
        | "manager"
        | "accountant"
        | "employee"
        | "viewer"
        | "ai_agent"
      warehouse_type:
        | "main"
        | "branch"
        | "retail"
        | "distribution"
        | "virtual"
        | "consignment"
        | "third_party"
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
      accounting_mode: ["simple", "standard", "strict"],
      adjustment_reason: [
        "cycle_count",
        "physical_inventory",
        "damaged",
        "expired",
        "lost",
        "found",
        "theft",
        "data_correction",
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
      asset_type: [
        "stock",
        "etf",
        "mutual_fund",
        "bond",
        "crypto",
        "commodity",
      ],
      automation_trigger: [
        "schedule",
        "event",
        "webhook",
        "threshold",
        "condition",
        "manual",
      ],
      bank_account_type: [
        "checking",
        "savings",
        "credit_card",
        "cash",
        "loan",
        "merchant",
        "investment",
      ],
      bank_transaction_type: [
        "deposit",
        "withdrawal",
        "transfer",
        "fee",
        "interest",
        "adjustment",
        "opening_balance",
      ],
      batch_status: ["pending", "processing", "completed", "failed"],
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
      budget_period: ["weekly", "monthly", "quarterly", "yearly"],
      catalog_object_type: [
        "table",
        "view",
        "column",
        "function",
        "metric",
        "business_term",
      ],
      contact_type: [
        "customer",
        "vendor",
        "customer_vendor",
        "employee",
        "other",
      ],
      document_status: [
        "uploaded",
        "processing",
        "processed",
        "failed",
        "archived",
      ],
      document_type: [
        "pdf",
        "csv",
        "xlsx",
        "docx",
        "txt",
        "image",
        "receipt",
        "invoice",
        "contract",
        "statement",
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
      erp_operation: [
        "read",
        "create",
        "update",
        "delete",
        "approve",
        "post",
        "void",
        "reconcile",
        "export",
      ],
      execution_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
        "timeout",
      ],
      fulfillment_status: [
        "pending",
        "picking",
        "packing",
        "ready_to_ship",
        "shipped",
        "in_transit",
        "delivered",
        "returned",
        "cancelled",
      ],
      goal_status: ["active", "paused", "completed", "cancelled"],
      goal_type: [
        "savings",
        "debt_payoff",
        "investment",
        "purchase",
        "emergency_fund",
        "retirement",
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
      organization_type: ["business", "personal", "hybrid"],
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
      permission_scope: ["global", "workspace", "entity", "record", "field"],
      plan_tier: [
        "starter",
        "professional",
        "enterprise",
        "custom",
        "personal-free",
        "personal-plus",
        "personal-pro",
        "family",
      ],
      purchase_order_status: [
        "draft",
        "pending_approval",
        "approved",
        "sent",
        "acknowledged",
        "partially_received",
        "received",
        "partially_billed",
        "billed",
        "completed",
        "cancelled",
        "on_hold",
      ],
      query_complexity: ["simple", "moderate", "complex", "advanced"],
      query_intent: [
        "read",
        "write",
        "analyze",
        "search",
        "report",
        "admin",
        "unknown",
      ],
      reconciliation_status: [
        "draft",
        "in_progress",
        "completed",
        "approved",
        "void",
      ],
      sales_order_status: [
        "draft",
        "pending",
        "confirmed",
        "in_fulfillment",
        "partially_fulfilled",
        "fulfilled",
        "partially_invoiced",
        "invoiced",
        "completed",
        "cancelled",
        "on_hold",
      ],
      stock_move_type: [
        "purchase",
        "sale",
        "transfer",
        "adjustment",
        "production",
        "return",
        "damage",
        "count",
      ],
      subscription_frequency: ["weekly", "monthly", "quarterly", "annual"],
      user_role: [
        "owner",
        "admin",
        "manager",
        "accountant",
        "employee",
        "viewer",
        "ai_agent",
      ],
      warehouse_type: [
        "main",
        "branch",
        "retail",
        "distribution",
        "virtual",
        "consignment",
        "third_party",
      ],
    },
  },
} as const


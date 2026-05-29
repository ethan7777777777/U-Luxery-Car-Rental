import { createClient } from "@supabase/supabase-js";

type Database = {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          name: string;
          slug: string;
          brand: string;
          model: string;
          tier: "classic" | "modern" | "ultra";
          year: number;
          price_per_day: number;
          image_url: string | null;
          description: string;
          gallery_urls: string[] | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          brand: string;
          model: string;
          tier: "classic" | "modern" | "ultra";
          year: number;
          price_per_day: number;
          image_url?: string | null;
          description: string;
          gallery_urls?: string[] | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: Partial<{
          name: string;
          slug: string;
          brand: string;
          model: string;
          tier: "classic" | "modern" | "ultra";
          year: number;
          price_per_day: number;
          image_url: string | null;
          description: string;
          gallery_urls: string[] | null;
          is_active: boolean;
          updated_at: string;
        }>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          vehicle_id: string;
          customer_name: string | null;
          email: string;
          phone: string;
          license_url: string | null;
          start_date: string;
          end_date: string;
          payment_status: string;
          booking_status: string;
          created_at: string;
        };
        Insert: {
          vehicle_id: string;
          customer_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email: string;
          phone: string;
          license_url?: string | null;
          start_date: string;
          end_date: string;
          total_price: number;
          deposit_amount?: number;
          charged_amount?: number;
          payment_type?: string;
          payment_status?: string;
          booking_status?: string;
          agreement_accepted?: boolean;
          pickup_time?: string;
          return_time?: string;
          updated_at?: string;
        };
        Update: Partial<{
          payment_status: string;
          booking_status: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      blocked_dates: {
        Row: {
          id: string;
          vehicle_id: string;
          blocked_from: string;
          blocked_to: string;
          reason: string | null;
        };
        Insert: {
          vehicle_id: string;
          blocked_from: string;
          blocked_to: string;
          reason?: string | null;
        };
        Update: Partial<{
          blocked_from: string;
          blocked_to: string;
          reason: string | null;
        }>;
        Relationships: [];
      };
      privacy_requests: {
        Row: {
          id: string;
          request_type:
            | "know"
            | "delete"
            | "correct"
            | "opt_out_sale"
            | "limit_sensitive_use";
          full_name: string;
          email: string;
          phone: string | null;
          details: string | null;
          status: "open" | "in_review" | "completed" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          request_type:
            | "know"
            | "delete"
            | "correct"
            | "opt_out_sale"
            | "limit_sensitive_use";
          full_name: string;
          email: string;
          phone?: string | null;
          details?: string | null;
          status?: "open" | "in_review" | "completed" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          request_type:
            | "know"
            | "delete"
            | "correct"
            | "opt_out_sale"
            | "limit_sensitive_use";
          full_name: string;
          email: string;
          phone: string | null;
          details: string | null;
          status: "open" | "in_review" | "completed" | "rejected";
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function getUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

export function getSupabaseAdmin() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(getUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

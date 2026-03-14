export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          name: string;
          destination: string | null;
          description: string | null;
          created_by: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          destination?: string | null;
          description?: string | null;
          created_by: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          destination?: string | null;
          description?: string | null;
          created_by?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trip_members: {
        Row: {
          trip_id: string;
          user_id: string;
          role: "owner" | "viewer";
          created_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
          role?: "owner" | "viewer";
          created_at?: string;
        };
        Update: {
          trip_id?: string;
          user_id?: string;
          role?: "owner" | "viewer";
          created_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      accommodations: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          address: string | null;
          url: string | null;
          price_per_night: number | null;
          check_in_date: string | null;
          check_out_date: string | null;
          notes: string | null;
          is_selected: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          address?: string | null;
          url?: string | null;
          price_per_night?: number | null;
          check_in_date?: string | null;
          check_out_date?: string | null;
          notes?: string | null;
          is_selected?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          name?: string;
          address?: string | null;
          url?: string | null;
          price_per_night?: number | null;
          check_in_date?: string | null;
          check_out_date?: string | null;
          notes?: string | null;
          is_selected?: boolean;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      accommodation_votes: {
        Row: {
          accommodation_id: string;
          user_id: string;
        };
        Insert: {
          accommodation_id: string;
          user_id: string;
        };
        Update: {
          accommodation_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      itinerary_days: {
        Row: {
          id: string;
          trip_id: string;
          date: string;
          location: string | null;
          accommodation_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          date: string;
          location?: string | null;
          accommodation_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          date?: string;
          location?: string | null;
          accommodation_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      travel_legs: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          type: "flight" | "drive";
          direction: "arrival" | "departure";
          origin: string;
          destination: string;
          departure_date: string;
          departure_time: string;
          arrival_date: string;
          arrival_time: string;
          airline: string | null;
          flight_number: string | null;
          confirmation_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          type: "flight" | "drive";
          direction: "arrival" | "departure";
          origin: string;
          destination: string;
          departure_date: string;
          departure_time: string;
          arrival_date: string;
          arrival_time: string;
          airline?: string | null;
          flight_number?: string | null;
          confirmation_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          user_id?: string;
          type?: "flight" | "drive";
          direction?: "arrival" | "departure";
          origin?: string;
          destination?: string;
          departure_date?: string;
          departure_time?: string;
          arrival_date?: string;
          arrival_time?: string;
          airline?: string | null;
          flight_number?: string | null;
          confirmation_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          trip_id: string;
          location_id: string | null;
          title: string;
          description: string | null;
          url: string | null;
          category: string | null;
          submitted_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          location_id?: string | null;
          title: string;
          description?: string | null;
          url?: string | null;
          category?: string | null;
          submitted_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          location_id?: string | null;
          title?: string;
          description?: string | null;
          url?: string | null;
          category?: string | null;
          submitted_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      idea_day_links: {
        Row: { idea_id: string; day_id: string };
        Insert: { idea_id: string; day_id: string };
        Update: { idea_id?: string; day_id?: string };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      trip_member_role: "owner" | "viewer";
      travel_type: "flight" | "drive";
      travel_direction: "arrival" | "departure";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

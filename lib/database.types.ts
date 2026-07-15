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
      primary_classes: {
        Row: {
          id: string;
          subject: "math" | "english";
          shortcode: string;
          name: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          subject: "math" | "english";
          shortcode: string;
          name: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          subject?: "math" | "english";
          shortcode?: string;
          name?: string;
          description?: string | null;
        };
      };
      skills: {
        Row: {
          id: string;
          primary_class_id: string;
          shortcode: string;
          name: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          primary_class_id: string;
          shortcode: string;
          name: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          primary_class_id?: string;
          shortcode?: string;
          name?: string;
          description?: string | null;
        };
      };
      questions: {
        Row: {
          id: string;
          subject: "math" | "english";
          sat_question_id: string | null;
          external_id: string | null;
          primary_class_id: string;
          skill_id: string;
          question_type: "mcq" | "spr";
          difficulty: "E" | "M" | "H";
          score_band: number | null;
          stimulus: string | null;
          stem: string;
          image_url: string | null;
          rationale: string | null;
          accepted_answers: Json | null;
          answer_format: Json | null;
          source: "other" | "satsuite" | "bluebook_live";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject: "math" | "english";
          sat_question_id?: string | null;
          external_id?: string | null;
          primary_class_id: string;
          skill_id: string;
          question_type: "mcq" | "spr";
          difficulty: "E" | "M" | "H";
          score_band?: number | null;
          stimulus?: string | null;
          stem: string;
          image_url?: string | null;
          rationale?: string | null;
          accepted_answers?: Json | null;
          answer_format?: Json | null;
          source?: "other" | "satsuite" | "bluebook_live";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject?: "math" | "english";
          sat_question_id?: string | null;
          external_id?: string | null;
          primary_class_id?: string;
          skill_id?: string;
          question_type?: "mcq" | "spr";
          difficulty?: "E" | "M" | "H";
          score_band?: number | null;
          stimulus?: string | null;
          stem?: string;
          image_url?: string | null;
          rationale?: string | null;
          accepted_answers?: Json | null;
          answer_format?: Json | null;
          source?: "other" | "satsuite" | "bluebook_live";
          created_at?: string;
          updated_at?: string;
        };
      };
      options: {
        Row: {
          id: string;
          question_id: string;
          label: string;
          option_text: string;
          is_correct: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          label: string;
          option_text: string;
          is_correct?: boolean;
          order_index: number;
        };
        Update: {
          id?: string;
          question_id?: string;
          label?: string;
          option_text?: string;
          is_correct?: boolean;
          order_index?: number;
        };
      };
      tests: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          is_official: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          is_official?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          is_official?: boolean;
          created_at?: string;
        };
      };
      modules: {
        Row: {
          id: string;
          test_id: string | null;
          subject: "math" | "english";
          title: string;
        };
        Insert: {
          id?: string;
          test_id?: string | null;
          subject: "math" | "english";
          title: string;
        };
        Update: {
          id?: string;
          test_id?: string | null;
          subject?: "math" | "english";
          title?: string;
        };
      };
      module_questions: {
        Row: {
          id: string;
          module_id: string;
          question_id: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          module_id: string;
          question_id: string;
          order_index: number;
        };
        Update: {
          id?: string;
          module_id?: string;
          question_id?: string;
          order_index?: number;
        };
      };
    };
    Enums: {
      subject_type: "math" | "english";
      question_type: "mcq" | "spr";
      difficulty: "E" | "M" | "H";
      question_source: "other" | "satsuite" | "bluebook_live";
    };
  };
}

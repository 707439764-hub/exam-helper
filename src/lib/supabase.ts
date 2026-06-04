import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表类型
export interface KnowledgePoint {
  id: string;
  title: string;
  content: string;
  category: "公文新闻" | "管理学" | "党建" | "行业知识";
  tags: string[];
  source: string;
  created_at: string;
}

export interface Question {
  id: string;
  type: "single_choice" | "multi_choice" | "true_false" | "essay";
  stem: string;
  options: {
    label: string;
    text: string;
  }[];
  answer: string;
  explanation: string;
  source_kp_id?: string;
  difficulty: number;
  created_at: string;
}

export interface QuizRecord {
  id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  created_at: string;
}

export interface StudyProgress {
  id: string;
  category: string;
  total_questions: number;
  correct_count: number;
  last_studied: string;
}

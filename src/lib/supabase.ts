import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

/**
 * 获取 Supabase 客户端（延迟初始化，避免环境变量缺失时构建崩溃）
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 未配置。请在环境变量中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

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

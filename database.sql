-- 南航干部竞聘考试复习系统 - 数据库建表脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 知识点表
CREATE TABLE knowledge_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('公文新闻', '管理学', '党建', '行业知识')),
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 题目表
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('single_choice', 'multi_choice', 'true_false', 'essay')),
  stem TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  answer TEXT NOT NULL,
  explanation TEXT DEFAULT '',
  source_kp_id UUID REFERENCES knowledge_points(id) ON DELETE SET NULL,
  difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 答题记录表
CREATE TABLE quiz_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 复习进度表
CREATE TABLE study_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  total_questions INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_studied TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_kp_category ON knowledge_points(category);
CREATE INDEX idx_kp_created_at ON knowledge_points(created_at DESC);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_source ON questions(source_kp_id);
CREATE INDEX idx_quiz_records_question ON quiz_records(question_id);
CREATE INDEX idx_quiz_records_created_at ON quiz_records(created_at DESC);
CREATE INDEX idx_study_progress_category ON study_progress(category);

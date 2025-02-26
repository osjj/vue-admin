-- 创建profiles表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 启用行级安全策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建触发器，当有新用户注册时自动在profiles表中创建记录
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 安全策略: 允许已认证用户读取profiles
CREATE POLICY "允许已认证用户查看所有profiles" 
  ON public.profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 安全策略: 允许用户更新自己的profile
CREATE POLICY "允许用户更新自己的profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 安全策略: 允许管理员更新任何profile
CREATE POLICY "允许管理员更新任何profile" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 为现有用户填充profiles表
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

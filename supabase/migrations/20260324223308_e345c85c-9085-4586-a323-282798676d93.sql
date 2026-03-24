
-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  author_name TEXT NOT NULL DEFAULT 'Dra. Marina Costa',
  author_role TEXT NOT NULL DEFAULT 'Veterinária Especialista',
  read_time INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'draft',
  related_posts UUID[] DEFAULT '{}'::uuid[],
  published_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all blog posts
CREATE POLICY "Admins can manage blog_posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read published blog posts
CREATE POLICY "Anyone can read published blog_posts"
  ON public.blog_posts FOR SELECT
  TO public
  USING (status = 'published');

-- Updated at trigger
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

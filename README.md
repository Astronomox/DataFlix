# DataFlix — The Student Portal That Actually Works

I'm a Data Science student at the University of Lagos. I know exactly what it's like to miss an announcement because it got buried in a WhatsApp group, or spend 20 minutes hunting for a past question that someone uploaded to the wrong folder, or have no idea what's on your timetable until the morning of the class.

DataFlix is my attempt to fix that. A full student portal built from scratch — for universities, by a student who actually uses one.

This isn't a tutorial project. I put serious time into this. The part that took the longest, and the part I'm most proud of, is the entire admin sectionalization system — making sure a 100-level Mechanical Engineering student only ever sees content relevant to them, while an admin from the Sciences department can't accidentally push announcements into Engineering. Getting that permission architecture right without it collapsing into recursion errors took real work. But it works. Properly.

## What Students Get

**A dashboard that's actually useful**
Every morning you open DataFlix, your AI assistant Flixy greets you with a personalised summary of your day — your classes, any new announcements, a motivational quote. It's the kind of thing that takes 30 seconds but sets your whole day right.

**Course materials that find you**
No more digging. Materials are automatically filtered by your department and academic level. A 200-level Physics student sees 200-level Physics content. That's it. Clean, fast, relevant.

**Your timetable, always**
A clear weekly schedule with filtering. You know exactly where you need to be and when.

**Announcements that reach the right people**
Department-specific, level-specific, or broadcast to everyone. Nothing gets lost.

**Dark mode**
Because we're not animals.

**A working contact form**
Powered by serverless functions and the Resend API. You report an issue, it actually goes somewhere.

## What Admins Get

This is where DataFlix gets serious.

There are two tiers of admin — Basic and Super. Basic Admins can upload, edit, and delete content, but only within their own department and academic level. They can't touch anything outside their lane. Super Admins have full control across the entire institution.

The permission system is built on Supabase Row Level Security with a custom `get_my_role()` function that bypasses RLS recursion — one of the trickier problems to solve cleanly. Every policy is explicit, intentional, and safe to redeploy.

Content management includes:
- Course material uploads with file storage
- Timetable entry management
- Targeted announcements (by level, department, or everyone)
- A live admin dashboard with user statistics and activity feeds

## Tech Stack

- **Framework:** Angular v20+ with Signals and Standalone Components (Zoneless)
- **Styling:** Tailwind CSS
- **Backend & Database:** Supabase — PostgreSQL, Auth, Row Level Security, Storage
- **AI:** Google Gemini API (powers Flixy)
- **Email:** Resend API via Vercel Serverless Function
- **Hosting:** Vercel

## Live Demo

[data-flix-wqe3.vercel.app](https://data-flix-wqe3.vercel.app)

## Setting It Up Yourself

### 1. Supabase Setup

Create a project at [supabase.com](https://supabase.com). Go to the SQL Editor and run the full schema below. It's idempotent — safe to run on both fresh and existing databases.

<details>
<summary>Click to expand the full SQL schema</summary>
```sql
-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  department TEXT NOT NULL,
  photourl TEXT,
  birthday DATE,
  phone TEXT,
  level INT NOT NULL DEFAULT 100
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual update access" ON public.users;
CREATE POLICY "Allow individual update access" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admin read access" ON public.users;
CREATE POLICY "Allow admin read access" ON public.users FOR SELECT USING (public.get_my_role() = 'admin');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new.id) AND new.raw_user_meta_data->>'name' IS NOT NULL THEN
    INSERT INTO public.users (id, name, email, role, department, level)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'name',
      new.email,
      COALESCE(new.raw_user_meta_data->>'role', 'student'),
      new.raw_user_meta_data->>'department',
      COALESCE((new.raw_user_meta_data->>'level')::INT, 100)
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_changed ON auth.users;

CREATE TRIGGER on_auth_user_changed
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  type TEXT NOT NULL,
  size TEXT NOT NULL,
  upload_date DATE NOT NULL,
  file_path TEXT NOT NULL,
  department TEXT,
  level INT
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to materials" ON public.materials;
CREATE POLICY "Allow read access to materials" ON public.materials FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin full access to materials" ON public.materials;
CREATE POLICY "Allow admin full access to materials" ON public.materials FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Timetable
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  course TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  level INT
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to timetable" ON public.timetable;
CREATE POLICY "Allow read access to timetable" ON public.timetable FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin full access to timetable" ON public.timetable;
CREATE POLICY "Allow admin full access to timetable" ON public.timetable FOR ALL USING (public.get_my_role() = 'admin');

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  department TEXT,
  level INT
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to announcements" ON public.announcements;
CREATE POLICY "Allow read access to announcements" ON public.announcements FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin full access to announcements" ON public.announcements;
CREATE POLICY "Allow admin full access to announcements" ON public.announcements FOR ALL USING (public.get_my_role() = 'admin');
```

</details>

### 2. Local Development
```bash
git clone https://github.com/Astronomox/DataFlix
cd DataFlix
npm install
npm start
```

Create a `.env` file in the root:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

App runs at `http://localhost:4200`

### 3. Deploy to Vercel

Import the repo into Vercel and add these environment variables:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `RESEND_API_KEY` | Powers the contact form emails |
| `API_KEY` | Google AI Studio key for Flixy |

After deploying, go to Supabase → Authentication → URL Configuration and add your Vercel URL to the allowed origins.

---

Built by Abdullahi Oriola — Data Science student, UNILAG. Built this because the portal we had wasn't good enough.

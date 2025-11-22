# DataFlix - The Modern Student Portal

DataFlix is a free, open-source student portal web app designed for universities and educational institutions. It provides a centralized platform for students and administrators to manage course materials, timetables, announcements, and personal profiles in a modern, reactive, and user-friendly interface.

Built with the latest version of Angular and powered by signals, the application is designed to be highly performant, scalable, and easy to maintain. It features a beautiful, responsive, mobile-first UI crafted with Tailwind CSS and includes a friendly AI assistant powered by the Google Gemini API to enhance the student experience.

![DataFlix Dashboard](https://i.imgur.com/your-dashboard-image.png) <!-- Replace with an actual screenshot -->

## ✨ Features

### For Students
- **Secure Authentication:** Robust login, registration, and secure password reset flow.
- **Personalized Dashboard:** A welcoming dashboard that displays a unique motivational quote daily, a dismissible AI-powered daily briefing, and provides quick access to key features.
- **AI Daily Briefing:** An AI assistant ("Flixy") that provides a warm, personalized greeting and a summary of the user's schedule for the day, accessible on the dashboard or a dedicated page.
- **Course Materials:** Browse, search, and download course materials. Materials are intelligently filtered by the student's level and department.
- **Weekly Timetable:** A clear, organized view of the weekly class schedule, with powerful filtering options.
- **Announcements:** Stay updated with the latest news and announcements relevant to your department and level.
- **Profile Management:** Users can view and edit their personal profile, including their name, academic level, and profile picture.
- **Dark Mode:** A beautiful, persistent dark mode for comfortable viewing in low-light conditions.
- **Contact Form:** A functional contact form for users to report issues or send feedback, powered by a secure serverless function and the Resend email service.

### For Administrators
- **Dedicated Admin Dashboard:** A powerful dashboard providing an at-a-glance overview of portal activity, including user statistics (total, students, admins) and feeds of recent uploads and announcements.
- **Role-Based Access Control (RBAC):**
  - **Basic Admins:** Can upload, edit, and delete content (materials, timetable entries, announcements) but are restricted to their own department and academic level.
  - **Super Admins:** Have full control over all content across all departments and levels.
- **Content Management:** Intuitive modals for uploading, editing, and deleting all types of content.
- **Targeted Communication:** Ability to post announcements and content for specific academic levels, specific departments, or broadcast to everyone ("All Levels" / "All Departments").

## 🚀 Tech Stack

- **Framework:** [Angular v20+](https://angular.dev/) (Standalone Components, Zoneless, Signals)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database:** [Supabase](https://supabase.io/) (PostgreSQL, Auth, Storage)
- **AI:** [Google Gemini API](https://ai.google.dev/)
- **Email Service:** [Resend](https://resend.com/) (via Vercel Serverless Function)
- **Hosting:** [Vercel](https://vercel.com/)

---

## 🛠️ Setup and Deployment Guide

Follow these steps to set up the project for local development or deploy it to Vercel.

### **Step 1: Set Up Supabase**

Your Supabase project is the backend for this application.

1.  **Create a Project:** Go to [supabase.com](https://supabase.com), sign up for a free account, and create a new project.
2.  **Run SQL Schema:** Navigate to the **SQL Editor** in your Supabase project dashboard. Click **"New query"** and paste the entire content of the schema below. This script is **idempotent**, meaning it is safe to run on both new and existing databases. Click **"RUN"**.
3.  **Get API Keys:** Go to **Project Settings > API**. You will need the **Project URL** and the **`anon` Public Key**.

#### **Complete & Safe Supabase SQL Schema**

```sql
-- Create the 'users' table ONLY if it doesn't already exist
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

-- Enable Row Level Security (RLS) for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- **FIX FOR RECURSION ERROR**
-- Create a helper function to get the current user's role.
-- This function runs with the privileges of the user who created it,
-- bypassing RLS and thus preventing infinite recursion on the 'users' table.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely create policies for the users table
DROP POLICY IF EXISTS "Allow individual read access" ON public.users;
CREATE POLICY "Allow individual read access" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual update access" ON public.users;
CREATE POLICY "Allow individual update access" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- **POLICY FOR ADMIN DASHBOARD (FIXED)**
DROP POLICY IF EXISTS "Allow admin read access" ON public.users;
CREATE POLICY "Allow admin read access" ON public.users FOR SELECT USING (public.get_my_role() = 'admin');


-- This robust function handles creating a user profile from the metadata
-- provided during signup. It is idempotent and safe to run again.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function is triggered on both user INSERT (signup) and UPDATE.
  -- The app's logic first signs up the user (INSERT) and then immediately updates them with metadata.
  -- This check ensures we only create a profile row if one doesn't exist AND
  -- if the necessary metadata (like 'name') is present, which only happens on the UPDATE trigger.
  -- This prevents the INSERT trigger from failing due to missing data.
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

-- Safely drop old triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_changed ON auth.users;

-- This trigger now runs on both INSERT and UPDATE of an auth.users record.
CREATE TRIGGER on_auth_user_changed
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Create storage bucket for user avatars (safe if it already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Safely create policies for avatar storage
DROP POLICY IF EXISTS "Allow individual avatar access" ON storage.objects;
CREATE POLICY "Allow individual avatar access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Allow individual avatar upload" ON storage.objects;
CREATE POLICY "Allow individual avatar upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Allow individual avatar update" ON storage.objects;
CREATE POLICY "Allow individual avatar update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);


-- Create the 'materials' table ONLY if it doesn't exist
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

-- Enable RLS for materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Safely create policies for materials
DROP POLICY IF EXISTS "Allow read access to materials" ON public.materials;
CREATE POLICY "Allow read access to materials" ON public.materials FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin full access to materials" ON public.materials;
CREATE POLICY "Allow admin full access to materials" ON public.materials FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');


-- Create storage bucket for course materials (safe if it exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Safely create policies for material storage
DROP POLICY IF EXISTS "Allow authenticated read access to materials storage" ON storage.objects;
CREATE POLICY "Allow authenticated read access to materials storage" ON storage.objects FOR SELECT USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Allow admin full access to materials storage" ON storage.objects;
CREATE POLICY "Allow admin full access to materials storage" ON storage.objects FOR ALL USING (bucket_id = 'materials' AND public.get_my_role() = 'admin');


-- Create the 'timetable' table ONLY if it doesn't exist
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  course TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  level INT
);

-- Enable RLS for timetable
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- Safely create policies for timetable
DROP POLICY IF EXISTS "Allow read access to timetable" ON public.timetable;
CREATE POLICY "Allow read access to timetable" ON public.timetable FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin full access to timetable" ON public.timetable;
CREATE POLICY "Allow admin full access to timetable" ON public.timetable FOR ALL USING (public.get_my_role() = 'admin');


-- Create the 'announcements' table ONLY if it doesn't exist
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  department TEXT,
  level INT
);

-- Enable RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Safely create policies for announcements
DROP POLICY IF EXISTS "Allow read access to announcements" ON public.announcements;
CREATE POLICY "Allow read access to announcements" ON public.announcements FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin full access to announcements" ON public.announcements;
CREATE POLICY "Allow admin full access to announcements" ON public.announcements FOR ALL USING (public.get_my_role() = 'admin');
```

---

### **Step 2: Local Development**

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/dataflix-student-portal.git
    cd dataflix-student-portal
    ```

2.  **Environment Variables:** In the root of the project, create a file named `.env`. This file is for local development secrets and should **not** be committed to Git. Add your Supabase keys to it:
    ```
    SUPABASE_URL=https://your-project-url.supabase.co
    SUPABASE_ANON_KEY=your-supabase-anon-key
    ```
    *The `supabase.config.ts` file is already set up to read these variables if they exist.*

3.  **Install Dependencies & Run:**
    ```bash
    npm install
    npm start
    ```
    The application will be running at `http://localhost:4200`.

---

### **Step 3: Deploy to Vercel**

1.  **Push to GitHub:** Make sure your latest code is pushed to your GitHub repository.
2.  **Import Project:** Log in to Vercel, click "Add New... > Project", and import your GitHub repository.
3.  **Configure Project:**
    -   **Framework Preset:** Vercel should automatically detect **Angular**.
    -   **Build and Output Settings:**
        -   Build Command: `npm run build`
        -   Output Directory: `dist`
    -   **Environment Variables:** Add the following secrets. This is the most critical step.

| Name              | Value                                     | Description                               |
| ----------------- | ----------------------------------------- | ----------------------------------------- |
| `SUPABASE_URL`    | *Your Supabase Project URL*               | Connects to your database.                |
| `SUPABASE_ANON_KEY` | *Your Supabase `anon` public key*       | Your public key for Supabase.             |
| `RESEND_API_KEY`  | *Your API key from resend.com*            | Powers the "Contact Us" email form.       |
| `API_KEY`         | *Your API key from Google AI Studio*      | Powers the "Flixy" AI assistant.          |

4.  **Deploy:** Click the "Deploy" button.
5.  **Configure CORS:** After the first successful deployment, you **must** authorize your Vercel URL in Supabase.
    -   Go to your Supabase project: **Authentication > URL Configuration**.
    -   Set the **Site URL** to your main Vercel URL (e.g., `https://your-project.vercel.app`).
    -   Scroll to **CORS Origins** and add your Vercel URL, including a wildcard for preview branches (e.g., `https://*.vercel.app`).
    -   Click **Save**.

Your application is now live!
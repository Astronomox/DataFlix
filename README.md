# DataFlix - The Modern Student Portal

DataFlix is a free, open-source student portal web application designed for universities to manage course materials, timetables, and announcements efficiently. Built with the latest version of Angular and powered by signals, it offers a modern, reactive, and user-friendly experience for students and administrators alike.

The portal features a clean, responsive interface styled with Tailwind CSS, a secure backend powered by Supabase, and a friendly AI assistant (Flixy) using the Google Gemini API to provide daily briefings to students.



## Features

### For Students
- **Personalized Dashboard:** A welcoming dashboard with a dismissible, AI-powered "Daily Briefing" that shows the user's schedule for the day.
- **Course Materials:** Easily browse, search, and download course materials filtered by academic level.
- **Weekly Timetable:** View a clear, color-coded weekly class schedule. Filter by course, location, or level.
- **Announcements:** Stay updated with the latest news from the department and university, with filtering options.
- **User Profile:** View and update personal information, including name, department, level, and profile picture.
- **Secure Authentication:** Full authentication flow including registration, login, and a secure password reset feature.
- **Contact Form:** A built-in contact form for reporting issues or leaving feedback, powered by a secure serverless function.
- **Dark/Light Mode:** A theme toggle to switch between light and dark modes, with user preference saved locally.

### For Administrators (Basic Admins)
- **Content Management:** Upload, edit, and delete course materials, announcements, and timetable entries.
- **Scoped Permissions:** Basic admins are restricted to managing content for their own department and academic level, ensuring data integrity. The UI clearly reflects these permissions by locking down relevant form fields.

### For Super Admins
- **Full Control:** Super Admins have complete control over all content across all departments and levels.
- **University-Wide Posts:** Ability to post materials, announcements, and timetable entries for "All Departments" and/or "All Levels" for university-wide communication.
- **Full Editing Capabilities:** Super Admins can edit the department and level of any piece of content after it has been created.

## Tech Stack

- **Frontend:** Angular 20+ (Standalone Components, Signals, Zoneless)
- **Styling:** Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
- **AI Integration:** Google Gemini API (`gemini-2.5-flash`)
- **Email Service:** Resend (via Vercel Serverless Function)
- **Deployment:** Vercel

## Getting Started (Local Development)

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites
- Node.js (v18 or higher)
- A code editor (e.g., VS Code)
- A free [Supabase](https://supabase.com/) account
- A free [Resend](https://resend.com/) account
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key for the Gemini API

### 1. Supabase Project Setup

1.  Go to your Supabase dashboard and create a new project.
2.  Once the project is created, navigate to the **SQL Editor**.
3.  Click **"New query"** and paste the entire content of the schema script below. This will create all the necessary tables, storage buckets, and row-level security (RLS) policies.
4.  Click **"RUN"**.

#### **Complete Supabase SQL Schema**
```sql
--
-- Create `users` table to store public user profiles
--
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student',
  department TEXT,
  photourl TEXT,
  birthday DATE,
  phone TEXT,
  level INT
);

--
-- Create `materials` table for course resources
--
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  type TEXT NOT NULL,
  size TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_path TEXT NOT NULL,
  department TEXT,
  level INT
);

--
-- Create `announcements` table
--
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  department TEXT,
  level INT
);

--
-- Create `timetable` table
--
CREATE TABLE public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  course TEXT NOT NULL,
  location TEXT NOT NULL,
  department TEXT,
  level INT
);

--
-- Create Storage Buckets
--
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif']),
  ('materials', 'materials', TRUE, 52428800, NULL); -- 50MB limit, all types allowed

--
-- Function to automatically copy new users from `auth.users` to `public.users`
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, department, level)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'department',
    (NEW.raw_user_meta_data->>'level')::INT
  );
  RETURN NEW;
END;
$$;

--
-- Trigger to execute the function on new user sign-up
--
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

--
-- Row Level Security (RLS) Policies
--

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- Policies for `users` table
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for `materials` table
CREATE POLICY "Authenticated users can view materials" ON public.materials FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can create materials" ON public.materials FOR INSERT WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins can update their own department's materials" ON public.materials FOR UPDATE USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND (SELECT department FROM public.users WHERE id = auth.uid()) = department );
CREATE POLICY "Super Admins can update any material" ON public.materials FOR UPDATE USING ( (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdullahioriola02@gmail.com' );
CREATE POLICY "Admins can delete their own department's materials" ON public.materials FOR DELETE USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND (SELECT department FROM public.users WHERE id = auth.uid()) = department );
CREATE POLICY "Super Admins can delete any material" ON public.materials FOR DELETE USING ( (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdullahioriola02@gmail.com' );

-- Policies for `announcements` table
CREATE POLICY "Authenticated users can view announcements" ON public.announcements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can create announcements" ON public.announcements FOR INSERT WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins can update their own department's announcements" ON public.announcements FOR UPDATE USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND (SELECT department FROM public.users WHERE id = auth.uid()) = department );
CREATE POLICY "Super Admins can update any announcement" ON public.announcements FOR UPDATE USING ( (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdullahioriola02@gmail.com' );
CREATE POLICY "Admins can delete their own department's announcements" ON public.announcements FOR DELETE USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND (SELECT department FROM public.users WHERE id = auth.uid()) = department );
CREATE POLICY "Super Admins can delete any announcement" ON public.announcements FOR DELETE USING ( (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdullahioriola02@gmail.com' );

-- Policies for `timetable` table
CREATE POLICY "Authenticated users can view timetable" ON public.timetable FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can create timetable entries" ON public.timetable FOR INSERT WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins can update their own department's timetable" ON public.timetable FOR UPDATE USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND (SELECT department FROM public.users WHERE id = auth.uid()) = department );
CREATE POLICY "Super Admins can update any timetable entry" ON public.timetable FOR UPDATE USING ( (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdullahioriola02@gmail.com' );
CREATE POLICY "Admins can delete their own department's timetable" ON public.timetable FOR DELETE USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND (SELECT department FROM public.users WHERE id = auth.uid()) = department );
CREATE POLICY "Super Admins can delete any timetable entry" ON public.timetable FOR DELETE USING ( (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdullahioriola02@gmail.com' );

-- Policies for `avatars` storage
CREATE POLICY "Users can view their own avatar" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' AND owner = auth.uid() );
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND owner = auth.uid() );
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE WITH CHECK ( bucket_id = 'avatars' AND owner = auth.uid() );

-- Policies for `materials` storage
CREATE POLICY "Authenticated users can view materials" ON storage.objects FOR SELECT USING ( bucket_id = 'materials' AND auth.role() = 'authenticated' );
CREATE POLICY "Admins can upload materials" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'materials' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Admins can delete their department's materials" ON storage.objects FOR DELETE USING ( bucket_id = 'materials' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' AND (storage.foldername(name))[1] = (SELECT department FROM public.users WHERE id = auth.uid()) );
CREATE POLICY "Super Admins can delete any material" ON storage.objects FOR DELETE USING ( bucket_id = 'materials' AND (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdullahioriola02@gmail.com' );
```

### 2. Configure Environment Variables

This project uses environment variables to securely store API keys.

1.  Navigate to your Supabase project **Settings > API**. Find your **Project URL** and **`anon` public API Key**.
2.  Get your **Resend API Key** from your Resend dashboard.
3.  Get your **Gemini API Key** from Google AI Studio.

In your local project, you don't need a `.env` file because the keys are hardcoded in `supabase.config.ts` and the services. However, for deployment, these must be set in your hosting provider's settings.

### 3. Run Locally

The application is set up to run in a modern development environment like AI Studio. Simply open the project and it will be served automatically.

## Deployment on Vercel

Vercel is the recommended platform for deploying this application.

### Step 1: Push to GitHub
Ensure your project is in a GitHub repository.

### Step 2: Import and Configure Project on Vercel
1.  Log in to your Vercel Dashboard and click **"Add New... > Project"**.
2.  Import your GitHub repository.
3.  On the **"Configure Project"** screen, use these settings:
    - **Framework Preset:** `Angular`
    - **Build and Output Settings:**
        - **Build Command:** `npm run build`
        - **Output Directory:** `dist`
        - **Install Command:** `npm install`
    - **Environment Variables:** Add the following variables.

| Name | Value |
| :--- | :--- |
| `SUPABASE_URL` | `https://eypbswfyjkmdsczqaaup.supabase.co` |
| `SUPABASE_ANON_KEY`| `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cGJzd2Z5amttZHNjenFhYXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODYzMzksImV4cCI6MjA3ODk2MjMzOX0.tqn3nDAklCLpxknL_SlZgyzob0SB8ybMqEgCUYqgZvA` |
| `RESEND_API_KEY` | `re_WXMzzHeK_61DsdgPgiiCaYpUJTZQg5dua` |
| `API_KEY` | *Your unique key from Google AI Studio* |

### Step 3: Deploy
Click the **"Deploy"** button. Vercel will build and deploy your application.

### Step 4: Configure Supabase CORS (CRITICAL)
After the first deployment, you must allow your Vercel URL to access Supabase.
1.  Go to your project on [supabase.com](https://supabase.com).
2.  Navigate to **Authentication > URL Configuration**.
3.  Set the **Site URL** to your main Vercel URL (e.g., `https://your-project.vercel.app`).
4.  Scroll down to **CORS Origins** and add your Vercel URL patterns:
    - `https://your-project.vercel.app`
    - `https://*.vercel.app`
5.  Click **"Save"**. After a minute, your live application will be fully functional.

## Project Structure

```
/
├── api/
│   └── send-email.ts      # Vercel Serverless Function for contact form
├── src/
│   ├── components/        # All Angular components
│   │   ├── ai-briefing/
│   │   ├── announcements/
│   │   ├── contact/
│   │   ├── dashboard/
│   │   ├── forgot-password/
│   │   ├── layout/        # Main app layout (header, sidebar)
│   │   ├── login/
│   │   ├── materials/
│   │   ├── notification/
│   │   ├── profile/
│   │   ├── register/
│   │   ├── reset-password/
│   │   └── timetable/
│   ├── data/              # Static data (courses, quotes)
│   ├── guards/            # Route guards
│   ├── models/            # TypeScript interfaces
│   ├── services/          # All injectable services
│   ├── app.component.ts   # Root component
│   └── app.routes.ts      # App routing configuration
├── index.html             # Main HTML file
├── index.tsx              # Application bootstrap
└── vercel.json            # Vercel deployment configuration
```

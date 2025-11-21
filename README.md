# DataFlix - The Modern Student Portal

DataFlix is a free, open-source student portal web app designed for universities and educational institutions. It provides a centralized platform for students and administrators to manage course materials, timetables, announcements, and personal profiles in a modern, reactive, and user-friendly interface.

Built with the latest version of Angular and powered by signals, the application is designed to be highly performant, scalable, and easy to maintain. It features a beautiful, responsive, mobile-first UI crafted with Tailwind CSS and includes a friendly AI assistant powered by the Google Gemini API to enhance the student experience.

![DataFlix Dashboard](https://i.imgur.com/your-dashboard-image.png) <!-- Replace with an actual screenshot -->

## ✨ Features

### For All Users
- **Secure Authentication:** Robust login, registration, and secure password reset flow.
- **Personalized Dashboard:** A welcoming dashboard that displays a unique motivational quote daily and provides quick access to key features.
- **AI Daily Briefing:** An AI assistant ("Flixy") powered by the Gemini API that provides a warm, personalized greeting and a summary of the user's schedule for the day.
- **Course Materials:** Browse, search, and download course materials. Materials can be filtered by academic level and department.
- **Weekly Timetable:** A clear, organized view of the weekly class schedule, with powerful filtering options.
- **Announcements:** Stay updated with the latest news and announcements from the university or specific departments.
- **Profile Management:** Users can view and edit their personal profile, including their name, academic level, and profile picture.
- **Dark Mode:** A beautiful, persistent dark mode for comfortable viewing in low-light conditions.
- **Contact Form:** A functional contact form for users to report issues or send feedback, powered by a secure serverless function and the Resend email service.

### For Administrators
- **Role-Based Access Control (RBAC):**
  - **Basic Admins:** Can upload, edit, and delete content (materials, timetable entries, announcements) but are restricted to their own department and academic level.
  - **Super Admins:** Have full control over all content across all departments and levels.
- **Content Management:** Intuitive modals for uploading, editing, and deleting all types of content.
- **Targeted Communication:** Ability to post announcements and content for specific academic levels, specific departments, or broadcast to everyone.

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
2.  **Run SQL Schema:** Navigate to the **SQL Editor** in your Supabase project dashboard. Click **"New query"** and paste the entire content of the schema below. Click **"RUN"**. This will create all the necessary tables and policies.
3.  **Get API Keys:** Go to **Project Settings > API**. You will need the **Project URL** and the **`anon` Public Key**.

#### **Complete Supabase SQL Schema**

```sql
-- Create the 'users' table to store public user profiles
CREATE TABLE public.users (
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

-- Policy: Allow users to view their own profile
CREATE POLICY "Allow individual read access"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Allow individual update access"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Function to automatically insert a new user into the public.users table upon registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, department, level)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'department',
    (new.raw_user_meta_data->>'level')::INT
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after a new user signs up in Supabase Auth
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatar storage: Allow users to manage their own avatars
CREATE POLICY "Allow individual avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Allow individual avatar upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Allow individual avatar update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = owner);


-- Create the 'materials' table
CREATE TABLE public.materials (
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

-- Policy: Allow authenticated users to view materials
CREATE POLICY "Allow read access to materials"
ON public.materials FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow admins to insert, update, and delete materials
CREATE POLICY "Allow admin full access to materials"
ON public.materials FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);


-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policies for material storage
CREATE POLICY "Allow authenticated read access to materials storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials');

CREATE POLICY "Allow admin full access to materials storage"
ON storage.objects FOR ALL
USING (
  bucket_id = 'materials' AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);


-- Create the 'timetable' table
CREATE TABLE public.timetable (
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

-- Policy: Allow authenticated users to view timetable
CREATE POLICY "Allow read access to timetable"
ON public.timetable FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow admins full access to timetable
CREATE POLICY "Allow admin full access to timetable"
ON public.timetable FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);


-- Create the 'announcements' table
CREATE TABLE public.announcements (
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

-- Policy: Allow authenticated users to view announcements
CREATE POLICY "Allow read access to announcements"
ON public.announcements FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow admins full access to announcements
CREATE POLICY "Allow admin full access to announcements"
ON public.announcements FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
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

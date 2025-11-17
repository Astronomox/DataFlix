# DataFlix Student Portal

A free, open-source student portal web app for universities to manage courses, resources, timetables, and announcements. Built with modern, zoneless Angular and Tailwind CSS, and powered by signals for a reactive experience.

## Backend

This project is configured to use **Supabase** for its backend database, authentication, and storage. You can find the configuration in `src/supabase.config.ts`.

## Deployment Guide (Vercel)

This project is designed for a "buildless" deployment, meaning it doesn't need a traditional build step on the server. Vercel is the perfect platform for this.

Follow these steps to deploy your portal for **free**.

### 1. Create a Vercel Project

- Go to your [Vercel Dashboard](https://vercel.com/dashboard).
- Click **"Add New..."** -> **"Project"**.
- Import the Git repository for this project.

### 2. Configure the Project Settings

This is the most important step. Vercel might try to auto-detect a framework. You need to override this.

- **Framework Preset:** Choose **`Other`**.
- **Build & Development Settings:**
  - **Build Command:** **Leave this field completely empty.**
  - **Output Directory:** Leave this as the default.
  - **Install Command:** Leave this empty.
- **Environment Variables:**
  - Add your Supabase credentials. These are necessary for your deployed app to connect to its database.
    - `SUPABASE_URL`: `olahomachuchu`
    - `SUPABASE_ANON_KEY`: `meowmeowgatling`

### 3. Deploy

- Click the **"Deploy"** button.
- Your site will be live in a few moments!

### 4. Finding Your "Normal" URL

Vercel will give you a few URLs. **You do not need to pay for a custom domain.**

- After a successful deployment, Vercel shows you a preview and a "Domains" section.
- **IGNORE** any URL that has `github.com` in it. That's just a system link for Vercel's internal use.
- Your main, public, and free URL will look like this: **`your-project-name.vercel.app`**.
- The easiest way to get to it is to click the **"Visit"** button on the deployment page.

That's it! You have a live, working, and free student portal.

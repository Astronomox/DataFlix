import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://eypbswfyjkmdsczqaaup.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cGJzd2Z5amttZHNjenFhYXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODYzMzksImV4cCI6MjA3ODk2MjMzOX0.tqn3nDAklCLpxknL_SlZgyzob0SB8ybMqEgCUYqgZvA';

// The applet environment may provide Supabase credentials via process.env.
// This aligns with the README and is a more secure practice than hardcoding.
const supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || defaultUrl;
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseKey);
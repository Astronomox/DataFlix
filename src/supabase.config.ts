import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eypbswfyjkmdsczqaaup.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cGJzd2Z5amttZHNjenFhYXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODYzMzksImV4cCI6MjA3ODk2MjMzOX0.tqn3nDAklCLpxknL_SlZgyzob0SB8ybMqEgCUYqgZvA';

export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lucphvkiaacjdwcgtekl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Y3BodmtpYWFjamR3Y2d0ZWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzEzODQsImV4cCI6MjA3OTQwNzM4NH0.wglbMFgJ950NFYGto7zvHJfMHvsJop7iFQvevAOp18s';

export const supabase = createClient(supabaseUrl, supabaseKey);
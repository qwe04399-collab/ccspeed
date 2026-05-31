import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://cqgubnoojujhixpmrqfo.supabase.co";

const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ3Vibm9vanVqaGl4cG1ycWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTk0NTAsImV4cCI6MjA5NTYzNTQ1MH0.LIKUUxnPwBZYz6_uX6taoMs9Azxka9mQF2O0_MXS6qA";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
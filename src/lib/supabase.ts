import { createClient } from "@supabase/supabase-js";

// TODO: Replace with environment variables in production
const SUPABASE_URL = "https://vgnefsowdwmfidyubppi.supabase.co";
const SUPABASE_KEY = "sb_publishable_OLq1NXiyflWskVBMLJmx8g_TB0ufM15"; // Publishable key

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

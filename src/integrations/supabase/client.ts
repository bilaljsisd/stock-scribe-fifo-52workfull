// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nxcgkslkvujyvhopxgvh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Y2drc2xrdnVqeXZob3B4Z3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTU5MjgsImV4cCI6MjA1OTc3MTkyOH0.kGFlLYPWK_UdLDd9ulAkcBs_gCqgvvFKH2183paHT0k";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
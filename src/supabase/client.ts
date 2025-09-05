import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

// Note: The `Database` type argument is optional and can be used for typed tables.
// For this example, we'll use string table names.
export const supabase = createClient(environment.supabase.url, environment.supabase.key);

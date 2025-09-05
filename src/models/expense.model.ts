export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  created_at?: string;
  // This will hold the joined category data from Supabase
  category: { id: number; name: string } | null;
}

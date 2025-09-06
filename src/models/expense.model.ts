// FIX: Import Category model to be used in the Expense interface for better type safety.
import { Category } from './category.model';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  created_at?: string;
  // This will hold the joined category data from Supabase
  category: Category | null;
}

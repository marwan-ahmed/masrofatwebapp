import { Injectable } from '@angular/core';
import { Expense } from '../models/expense.model';
import { Category } from '../models/category.model';
import { supabase } from '../supabase/client';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching categories:', error);
      alert('خطأ في جلب الفئات: ' + error.message);
      return [];
    }
    return data || [];
  }

  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:categories(id, name)')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      alert('خطأ في جلب البيانات: ' + error.message);
      return [];
    }

    // Supabase returns the joined table with a different name if not aliased.
    // Here we aliased 'categories' to 'category'.
    return (data as any[]) || [];
  }

  async addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'category'> & { category_id: number }): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select('*, category:categories(id, name)')
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return null;
    }
    
    return data as any;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .match({ id });

    if (error) {
      console.error('Error deleting expense:', error);
      return false;
    }

    return true;
  }
}

// Implemented the ExpenseService to provide all data access logic.
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { supabase } from '../supabase/client';
import { Expense } from '../models/expense.model';
import { Category } from '../models/category.model';

// Type for inserting/updating expenses, as the `category` field is for reads only.
type UpsertExpense = {
  description: string;
  amount: number;
  date: string;
  category_id: number | null;
};

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {

  getExpenses(): Observable<Expense[]> {
    const promise = supabase
      .from('expenses')
      .select(`
        id,
        description,
        amount,
        date,
        created_at,
        category:categories (id, name)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(response => {
        if (response.error) {
          console.error('Error fetching expenses:', response.error);
          throw response.error;
        }
        // FIX: Manually correct the category shape, as Supabase might return an array for a joined table.
        const data = response.data || [];
        return data.map(item => ({
          ...item,
          category: Array.isArray(item.category) ? (item.category[0] || null) : item.category,
        })) as Expense[];
      });
    return from(promise);
  }

  getCategories(): Observable<Category[]> {
    const promise = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
      .then(response => {
        if (response.error) {
          console.error('Error fetching categories:', response.error);
          throw response.error;
        }
        return response.data as Category[];
      });
    return from(promise);
  }

  addExpense(expense: UpsertExpense): Observable<Expense> {
    const promise = supabase
      .from('expenses')
      .insert([expense])
      .select(`
        id,
        description,
        amount,
        date,
        created_at,
        category:categories (id, name)
      `)
      .single()
      .then(response => {
        if (response.error) {
          console.error('Error adding expense:', response.error);
          throw response.error;
        }
        if (!response.data) {
          throw new Error('Failed to add expense: no data returned.');
        }
        // FIX: Manually correct the category shape.
        const data = response.data;
        return {
          ...data,
          category: Array.isArray(data.category) ? (data.category[0] || null) : data.category
        } as Expense;
      });
    return from(promise);
  }

  updateExpense(id: number, expense: Partial<UpsertExpense>): Observable<Expense> {
    const promise = supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .select(`
        id,
        description,
        amount,
        date,
        created_at,
        category:categories (id, name)
      `)
      .single()
      .then(response => {
        if (response.error) {
          console.error('Error updating expense:', response.error);
          throw response.error;
        }
        if (!response.data) {
          throw new Error('Failed to update expense: no data returned.');
        }
        // FIX: Manually correct the category shape.
        const data = response.data;
        return {
          ...data,
          category: Array.isArray(data.category) ? (data.category[0] || null) : data.category
        } as Expense;
      });
    return from(promise);
  }

  deleteExpense(id: number): Observable<void> {
    const promise = supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .then(response => {
        if (response.error) {
          console.error('Error deleting expense:', response.error);
          throw response.error;
        }
      });
    return from(promise);
  }
}
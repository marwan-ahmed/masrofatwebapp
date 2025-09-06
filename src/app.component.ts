// FIX: The placeholder content is replaced with a complete implementation for the AppComponent.
// This component now manages and displays expenses, and includes a form for adding and editing them.
import { Component, OnInit, signal, ChangeDetectionStrategy, inject, computed, WritableSignal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ExpenseService } from './services/expense.service';
import { Expense } from './models/expense.model';
import { Category } from './models/category.model';

// Type for inserting/updating expenses, as the `category` field is for reads only.
type UpsertExpense = {
  description: string;
  amount: number;
  date: string;
  category_id: number | null;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  template: `
    <div class="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen font-sans">
      <header class="bg-sky-600 text-white shadow-md">
        <div class="container mx-auto px-4 py-6">
          <h1 class="text-3xl font-bold">متتبع المصروفات</h1>
        </div>
      </header>
      
      <main class="container mx-auto px-4 py-8">
        
        @if (error()) {
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong class="font-bold">خطأ:</strong>
            <span class="block sm:inline">{{ error() }}</span>
          </div>
        }

        <!-- Add/Edit Form -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 class="text-2xl font-semibold mb-4">{{ editingExpense() ? 'تعديل' : 'إضافة' }} مصروف</h2>
          <form [formGroup]="expenseForm" (ngSubmit)="saveExpense()">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Description -->
              <div class="flex flex-col">
                <label for="description" class="mb-1 font-medium text-gray-700 dark:text-gray-300">الوصف</label>
                <input id="description" type="text" formControlName="description" class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-700" placeholder="مثال: مشتريات البقالة">
                @if (expenseForm.get('description')?.invalid && expenseForm.get('description')?.touched) {
                  <p class="text-red-500 text-sm mt-1">الوصف مطلوب.</p>
                }
              </div>

              <!-- Amount -->
              <div class="flex flex-col">
                <label for="amount" class="mb-1 font-medium text-gray-700 dark:text-gray-300">المبلغ (ر.س)</label>
                <input id="amount" type="number" formControlName="amount" class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-700" placeholder="مثال: 50.25">
                 @if (expenseForm.get('amount')?.invalid && expenseForm.get('amount')?.touched) {
                  <p class="text-red-500 text-sm mt-1">المبلغ المدخل يجب أن يكون رقماً صحيحاً.</p>
                }
              </div>

              <!-- Date -->
              <div class="flex flex-col">
                <label for="date" class="mb-1 font-medium text-gray-700 dark:text-gray-300">التاريخ</label>
                <input id="date" type="date" formControlName="date" class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-700">
                @if (expenseForm.get('date')?.invalid && expenseForm.get('date')?.touched) {
                  <p class="text-red-500 text-sm mt-1">التاريخ مطلوب.</p>
                }
              </div>
              
              <!-- Category -->
              <div class="flex flex-col">
                <label for="category" class="mb-1 font-medium text-gray-700 dark:text-gray-300">الفئة</label>
                <select id="category" formControlName="category_id" class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-700">
                  <option [ngValue]="null">غير مصنف</option>
                  @for (category of categories(); track category.id) {
                    <option [value]="category.id">{{ category.name }}</option>
                  }
                </select>
              </div>
            </div>
            
            <div class="flex items-center justify-end mt-6 space-x-3">
              @if (editingExpense()) {
                <button type="button" (click)="cancelEdit()" class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">إلغاء</button>
              }
              <button type="submit" [disabled]="expenseForm.invalid" class="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:bg-sky-300 dark:disabled:bg-sky-800 disabled:cursor-not-allowed">
                {{ editingExpense() ? 'تحديث المصروف' : 'إضافة مصروف' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Expenses List -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
          <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 class="text-2xl font-semibold">قائمة المصروفات</h2>
            <p class="text-lg font-medium text-gray-600 dark:text-gray-300">الإجمالي: <span class="font-bold text-sky-700 dark:text-sky-400">{{ totalExpenses() | currency:'SAR':'symbol':'1.2-2' }}</span></p>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 uppercase text-sm">
                <tr>
                  <th class="p-3">الوصف</th>
                  <th class="p-3">المبلغ</th>
                  <th class="p-3">التاريخ</th>
                  <th class="p-3">الفئة</th>
                  <th class="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                @for (expense of expenses(); track expense.id; let i = $index) {
                  <tr class="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50" [class.bg-gray-50]="i % 2 !== 0" [class.dark:bg-slate-700/20]="i % 2 !== 0">
                    <td class="p-3 font-medium">{{ expense.description }}</td>
                    <td class="p-3">{{ expense.amount | currency:'SAR':'symbol':'1.2-2' }}</td>
                    <td class="p-3 text-gray-600 dark:text-gray-400">{{ expense.date | date:'mediumDate' }}</td>
                    <td class="p-3">
                      <span [class]="expense.category ? 'px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' : 'text-gray-500 dark:text-gray-400'">
                        {{ expense.category?.name || 'غ/م' }}
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <button (click)="startEditExpense(expense)" class="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="تعديل المصروف">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                      </button>
                      <button (click)="deleteExpense(expense.id)" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="حذف المصروف">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center p-6 text-gray-500 dark:text-gray-400">لم يتم تسجيل أي مصروفات بعد.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      input, select {
        height: 42px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private fb = inject(FormBuilder);

  expenses: WritableSignal<Expense[]> = signal([]);
  categories: WritableSignal<Category[]> = signal([]);
  error: WritableSignal<string | null> = signal(null);
  editingExpense: WritableSignal<Expense | null> = signal(null);

  expenseForm: FormGroup;

  constructor() {
    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      category_id: [null],
    });
  }

  ngOnInit() {
    this.loadExpenses();
    this.loadCategories();
  }

  loadExpenses() {
    this.expenseService.getExpenses().subscribe({
      next: (data) => this.expenses.set(data),
      error: (err) => {
        console.error(err);
        this.error.set('فشل تحميل المصروفات.');
      },
    });
  }

  loadCategories() {
    this.expenseService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => {
        console.error(err);
        this.error.set('فشل تحميل الفئات.');
      }
    });
  }

  startAddExpense() {
    this.editingExpense.set(null);
    this.expenseForm.reset({
        date: new Date().toISOString().substring(0, 10),
        amount: null,
        description: '',
        category_id: null
    });
    this.expenseForm.markAsPristine();
    this.expenseForm.markAsUntouched();
  }

  startEditExpense(expense: Expense) {
    this.editingExpense.set(expense);
    this.expenseForm.patchValue({
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      category_id: expense.category?.id || null,
    });
  }
  
  cancelEdit() {
    this.startAddExpense();
  }

  saveExpense() {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const formValue = this.expenseForm.value;
    const expenseData: UpsertExpense = {
      description: formValue.description,
      amount: parseFloat(formValue.amount),
      date: formValue.date,
      category_id: formValue.category_id ? Number(formValue.category_id) : null,
    };

    const editing = this.editingExpense();
    if (editing) {
      this.expenseService.updateExpense(editing.id, expenseData).subscribe({
        next: (updatedExpense) => {
          this.expenses.update(expenses => 
            expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e)
          );
          this.cancelEdit();
        },
        error: (err) => {
          console.error(err);
          this.error.set('فشل تحديث المصروف.');
        }
      });
    } else {
      this.expenseService.addExpense(expenseData).subscribe({
        next: (newExpense) => {
          this.expenses.update(expenses => [newExpense, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          this.startAddExpense();
        },
        error: (err) => {
          console.error(err);
          this.error.set('فشل إضافة المصروف.');
        }
      });
    }
  }

  deleteExpense(id: number) {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      this.expenseService.deleteExpense(id).subscribe({
        next: () => {
          this.expenses.update(expenses => expenses.filter(e => e.id !== id));
          if (this.editingExpense()?.id === id) {
            this.cancelEdit();
          }
        },
        error: (err) => {
          console.error(err);
          this.error.set('فشل حذف المصروف.');
        }
      });
    }
  }

  totalExpenses = computed(() => {
    return this.expenses().reduce((total, expense) => total + expense.amount, 0);
  });
}

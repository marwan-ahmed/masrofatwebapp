import { Component, ChangeDetectionStrategy, signal, computed, inject, WritableSignal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense } from './models/expense.model';
import { Category } from './models/category.model';
import { ExpenseService } from './services/expense.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [], // No separate CSS file, using Tailwind via template
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AppComponent implements OnInit {
  private expenseService = inject(ExpenseService);

  // Signals for state management
  expenses: WritableSignal<Expense[]> = signal([]);
  categories: WritableSignal<Category[]> = signal([]);
  isLoading = signal(true);
  
  // Signals for new expense form
  newExpenseDescription = signal('');
  newExpenseAmount = signal<number | null>(null);
  newExpenseCategoryId = signal<number | null>(null);
  newExpenseDate = signal(this.getTodayDateString());

  // Signals for filtering
  filterFromDate = signal('');
  filterToDate = signal('');

  // Computed signal for filtered expenses
  filteredExpenses = computed(() => {
    const allExpenses = this.expenses();
    const from = this.filterFromDate();
    const to = this.filterToDate();

    if (!from && !to) {
      return allExpenses;
    }

    return allExpenses.filter(expense => {
      const expenseDate = expense.date;
      const isAfterFrom = from ? expenseDate >= from : true;
      const isBeforeTo = to ? expenseDate <= to : true;
      return isAfterFrom && isBeforeTo;
    });
  });

  // Computed signal for total expenses
  totalExpenses = computed(() => {
    return this.filteredExpenses().reduce((total, expense) => total + expense.amount, 0);
  });
  
  constructor() {
    // Data fetching will be done in ngOnInit
  }

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    const [expenses, categories] = await Promise.all([
      this.expenseService.getExpenses(),
      this.expenseService.getCategories()
    ]);
    
    this.expenses.set(expenses);
    this.categories.set(categories);

    if (categories.length > 0) {
      this.newExpenseCategoryId.set(categories[0].id);
    }

    this.isLoading.set(false);
  }

  getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  async addExpense(): Promise<void> {
    const description = this.newExpenseDescription().trim();
    const amount = this.newExpenseAmount();
    const categoryId = this.newExpenseCategoryId();
    const date = this.newExpenseDate();

    if (!description || amount === null || amount <= 0) {
      alert('الرجاء إدخال وصف صحيح ومبلغ أكبر من صفر.');
      return;
    }
    if (categoryId === null) {
      alert('الرجاء اختيار فئة للمصروف.');
      return;
    }

    const newExpenseData = {
      description,
      amount,
      category_id: categoryId,
      date
    };

    const addedExpense = await this.expenseService.addExpense(newExpenseData);
    
    if (addedExpense) {
      this.expenses.update(currentExpenses => [addedExpense, ...currentExpenses].sort((a, b) => b.date.localeCompare(a.date)));
      
      // Reset form
      this.newExpenseDescription.set('');
      this.newExpenseAmount.set(null);
      if (this.categories().length > 0) {
        this.newExpenseCategoryId.set(this.categories()[0].id);
      }
      this.newExpenseDate.set(this.getTodayDateString());
    } else {
      alert('حدث خطأ أثناء إضافة المصروف. الرجاء المحاولة مرة أخرى.');
    }
  }

  async deleteExpense(id: number): Promise<void> {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المصروف؟')) {
      const success = await this.expenseService.deleteExpense(id);
      if (success) {
        this.expenses.update(currentExpenses => currentExpenses.filter(e => e.id !== id));
      } else {
        alert('حدث خطأ أثناء حذف المصروف. الرجاء المحاولة مرة أخرى.');
      }
    }
  }

  exportToCSV(): void {
    const expensesToExport = this.filteredExpenses();
    if (expensesToExport.length === 0) {
      alert('لا توجد بيانات لتصديرها.');
      return;
    }

    const headers = ['المعرف', 'الوصف', 'المبلغ', 'الفئة', 'التاريخ'];
    const rows = expensesToExport.map(e => 
        [
            e.id, 
            `"${(e.description || '').replace(/"/g, '""')}"`, 
            e.amount, 
            `"${(e.category?.name || 'غير مصنف').replace(/"/g, '""')}"`, 
            e.date
        ]
    );

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  }

  resetFilters(): void {
    this.filterFromDate.set('');
    this.filterToDate.set('');
  }
}

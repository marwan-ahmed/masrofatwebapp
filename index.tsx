// FIX: Replaced placeholder text with Angular bootstrap logic.
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { ExpenseService } from './src/services/expense.service';

// Explicitly providing the service at bootstrap ensures the dependency injector
// can find it, which is a more robust solution in some environments.
bootstrapApplication(AppComponent, {
  providers: [
    ExpenseService
  ]
})
  .catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
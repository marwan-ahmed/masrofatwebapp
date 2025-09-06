// FIX: Replaced placeholder text with Angular bootstrap logic.
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './src/app.component';

// By explicitly providing dependencies like ReactiveFormsModule at the root,
// we ensure that services like FormBuilder are available globally from the very
// start. This resolves subtle dependency injection issues during bootstrap.
bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(ReactiveFormsModule)
  ]
})
  .catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.

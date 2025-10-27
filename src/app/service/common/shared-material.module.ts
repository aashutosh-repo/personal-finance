// shared-material.module.ts
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export const SharedMaterialModules = [
  CommonModule,
  FormsModule,
  MatIconModule,
  MatCardModule,
  MatGridListModule,
  MatButtonModule,
  MatDividerModule,
  MatTableModule,
  MatListModule,
  MatSliderModule,
  MatLabel,
  MatFormFieldModule,
  MatInputModule,
  MatRadioModule,
  MatSelectModule,
  ReactiveFormsModule
];

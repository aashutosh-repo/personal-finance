// src/app/shared/charts/charts-wrapper.module.ts
import { NgModule } from '@angular/core';
import { BaseChartDirective  } from 'ng2-charts';

@NgModule({
  imports: [BaseChartDirective ],
  exports: [BaseChartDirective ]
})
export class ChartsWrapperModule {}

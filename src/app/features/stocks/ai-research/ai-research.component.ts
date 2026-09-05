import { Component, inject, OnDestroy, signal } from '@angular/core';
import { SharedMaterialModules } from '../../../service/common/shared-material.module';
import { AiResearchService } from '../../../service/stocks/ai-research.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AiJobStatusResponse } from '../models/stock.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-ai-research',
  standalone: true,
  imports: [SharedMaterialModules],
  templateUrl: './ai-research.component.html',
  styleUrl: './ai-research.component.scss'
})
export class AiResearchComponent implements OnDestroy{
  private aiService = inject(AiResearchService);
  private route = inject(ActivatedRoute);

  mode: 'sync' | 'async' =  'sync';

  readonly loading = signal(false);
  readonly response = signal<string | null>(null);
  readonly toolIsUsed = signal<string[] | null>([]);
  readonly sources = signal<string[] | null>([]);
  readonly grounded = signal<boolean | null>(null);
  readonly groundingIssue = signal<string[] | null>([]);
  readonly error = signal<string | null>(null);

  readonly jobId = signal<string | null>(null);
  readonly jobStatus = signal<AiJobStatusResponse['status'] | null>(null);
  readonly jobPregress = signal(0);

  private pollSub?: Subscription;

  question: string = '';


  readonly examplePrompt = [
    'what are fundamental of TCS?'
  ]

  constructor() {
    const symbol = this.route.snapshot.queryParamMap.get('symbol');
    if(symbol) {
      this.question = `Give me an in depth research report on ${symbol.toUpperCase()} covering fundamentals, valuation, and risks`
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  usePrompt(prompt: string) : void {
    this.question = prompt;
  }

   submit(): void {
    if(!this.question.trim()) return;

    this.resetResult();

    if(this.mode === 'sync') {
      this.runSync();
    } else {
      this.runAsync();
    }
   }

   private runSync(): void {
    this.loading.set(true);
    this.aiService.chat(this.question).subscribe({
      next: (res) => {
        this.response.set(res.response);
        this.toolIsUsed.set(res.tools_used || []);
        this.sources.set(res.sources || []);
        this.grounded.set(res.grounded ?? null);
        this.groundingIssue.set(res.grounding_issues || []);
        this.loading.set(false);
      }, 
      error: (err) => {
        this.error.set(err?.error?.detail || err?.message || 'Ai Request failed');
        this.loading.set(false);
      }
    })
   }

      private runAsync(): void {
    this.loading.set(true);
    this.aiService.submitJob(this.question).subscribe({
      next: (res) => {
        this.jobId.set(res.job_id);
        this.jobStatus.set(res.status as AiJobStatusResponse['status']);
        this.jobPregress.set(res.progress);
        this.startPooling(res.job_id);
      }, 
      error: (err) => {
        this.error.set(err?.error?.detail || err?.message || 'Failed to submit the Job');
        this.loading.set(false);
      }
    })
   }

   private startPooling(jobId: string): void {
    this.pollSub?.unsubscribe();
    this.pollSub = interval(1500).subscribe(() => {
      this.aiService.getJob(jobId).subscribe({
        next: (job) => {
          this.jobStatus.set(job.status);
          this.jobPregress.set(job.progress);
          if(job.status === 'completed') {
            this.response.set(job.response);
            this.toolIsUsed.set(job.tools_used || [])
            this.sources.set(job.source || []);
            this.grounded.set(job.grounded ?? null);
            this.loading.set(false);
            this.pollSub?.unsubscribe();
          }
        }, 
        error: (err) => {
          this.error.set(err?.error?.detail || 'Failed to Poll job status');
          this.loading.set(false);
          this.pollSub?.unsubscribe();
        }
      })
    })
   }

   resetResult(): void {
    this.response.set(null);
    this.toolIsUsed.set([]);
    this.sources.set([])
    this.grounded.set(null);
    this.groundingIssue.set(null);
    this.error.set(null);
    this.jobId.set(null);
    this.jobStatus.set(null);
    this.jobPregress.set(0);
   }

}

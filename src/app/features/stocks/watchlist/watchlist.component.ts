import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedMaterialModules } from '../../../service/common/shared-material.module';
import { WatchlitService } from '../../../service/stocks/watchlist.service';
import { WatchlistEntry } from '../models/stock.model';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [SharedMaterialModules],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit{

  private router = inject(Router);
  private watchlistService = inject(WatchlitService);
  private snackbar = inject(MatSnackBar)

  readonly entries = this.watchlistService.entries;

  readonly columns = ['symbol', 'addedAt', 'targetPrice', 'alertOnDrop', 'notes', 'action'];

  form: AddForm = {
    symbol: '',
    targetPrice : null,
    alertOnDrop: null,
    notes: '',
  }

  add(): void {
    if (!this.form.symbol.trim()) return;
    if (this.watchlistService.has(this.form.symbol)) {
      this.snackbar.open('Already in watchlist', 'OK', {duration: 2000});
      return;
    }

    this.watchlistService.add(
    this.form.symbol,
    this.form.targetPrice,
    this.form.alertOnDrop,
    this.form.notes
    )
    this.snackbar.open(`${this.form.symbol.toUpperCase()} added`, 'OK', {duration: 2000});
    this.form = {symbol: '', targetPrice: null, alertOnDrop: null, notes: ''}
  }

  remove(entry : WatchlistEntry): void {
    this.watchlistService.remove(entry.symbol);
    this.snackbar.open(`${entry.symbol} removed`, 'OK', {duration: 2000});
  }

  open(entry : WatchlistEntry): void {
    this.router.navigate(['v1/stocks', entry.symbol])
  }

  research(entry : WatchlistEntry): void {
    this.router.navigate(['/v1/stocks/research'], {queryParams: {symbol: entry.symbol}});
  }

  hasActiveAlert(entry : WatchlistEntry): boolean{
    return (entry.targetPrice ?? 0) > 0 || (entry.alertOnDrop ?? 0) > 0;
  }









  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }



}

interface AddForm {
  symbol: string;
  targetPrice: number | null;
  alertOnDrop: number | null;
  notes: string;
}
import { Injectable, signal } from "@angular/core";
import path from "path";
import { throwMatDuplicatedDrawerError } from "@angular/material/sidenav";
import { CdkTextColumn } from "@angular/cdk/table";
import { WatchlistEntry } from "../../features/stocks/models/stock.model";



@Injectable({providedIn: 'root'})
export class WatchlitService {
    private readonly STORAGE_KEY = 'ft.stocks.watchlist.v1'
    private readonly _entries = signal<WatchlistEntry[]>(this.load());
    readonly entries = this._entries.asReadonly();


    add(symbol: string, targetPrice?: number| null, alertOnDrop?: number | null, notes?: string): void{

        const upper = symbol.trim().toUpperCase();
        if(!upper) {
            return;
        }

        const current = this._entries();
        if(current.some((e) => e.symbol === upper)) return;
        
        const next: WatchlistEntry[] = [
            ...current,
            {
                symbol: upper,
                addedAt: new Date().toISOString(),
                targetPrice: targetPrice ?? null,
                alertOnDrop: alertOnDrop ?? null,
                notes: notes ?? '',
            },
        ];
        this._entries.set(next);
        this.persist(next);
    }


    remove(symbol: string): void {
        const next = this._entries().filter((e) => e.symbol !== symbol.toUpperCase());
        this._entries.set(next);
        this.persist(next);
    }

    update(symbol: string, patch: Partial<WatchlistEntry>): void {
        const next = this._entries().filter((e) => 
            e.symbol === symbol.toUpperCase() ? {...e, ...patch, symbol: e.symbol} : e);
        this._entries.set(next);
        this.persist(next)
    }

    has(symbol: string): boolean {
        return this._entries().some((e) => e.symbol === symbol.toUpperCase());
    }

    private load() {
        if (typeof localStorage === 'undefined') return []
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? (JSON.parse(raw) as WatchlistEntry[]) : [];
        } catch {
            return [];
        }
    }

    private persist(entries: WatchlistEntry[]): void{
        if(typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
        } catch {
            // ignore
        }
    
    }

} 
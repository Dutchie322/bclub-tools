import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { BehaviorSubject, EMPTY, Observable, Subject, Subscription, from, merge } from 'rxjs';
import { distinctUntilChanged, map, skip, startWith, switchMap, tap } from 'rxjs/operators';
import { IPage } from './models';

export interface IPageQuery<F> {
  sort: Sort;
  pageIndex: number;
  pageSize: number;
  filter: F;
}

export type PageQueryFunction<T, F> = (query: IPageQuery<F>) => Promise<IPage<T>>;

/**
 * Data source for a Material table that leaves sorting, filtering and paging
 * to a query, so only the rows of the current page have to be read from the
 * database. Use it like `MatTableDataSource`: assign `sort`, `paginator` and
 * `filter`, and set `query` to retrieve a page.
 */
export class IndexedDbDataSource<T, F = unknown> extends DataSource<T> {
  private readonly rows = new BehaviorSubject<T[]>([]);
  private readonly loadingSubject = new BehaviorSubject(0);
  private readonly filterSubject: BehaviorSubject<F>;
  private readonly reloadSubject = new Subject<void>();
  private changeSubscription: Subscription | null = null;
  private connected = false;
  private _sort: MatSort | null = null;
  private _paginator: MatPaginator | null = null;
  private _query: PageQueryFunction<T, F> | null = null;

  // Whether a page is being retrieved
  public readonly loading$ = this.loadingSubject.pipe(map(count => count > 0), distinctUntilChanged());

  constructor(initialFilter: F) {
    super();
    this.filterSubject = new BehaviorSubject(initialFilter);
  }

  public get filter(): F {
    return this.filterSubject.value;
  }

  public set filter(filter: F) {
    this.filterSubject.next(filter);
  }

  public get sort(): MatSort | null {
    return this._sort;
  }

  public set sort(sort: MatSort | null) {
    this._sort = sort;
    this.updateChangeSubscription();
  }

  public get paginator(): MatPaginator | null {
    return this._paginator;
  }

  public set paginator(paginator: MatPaginator | null) {
    this._paginator = paginator;
    this.updateChangeSubscription();
  }

  public get query(): PageQueryFunction<T, F> | null {
    return this._query;
  }

  /**
   * Setting a new query goes back to the first page and retrieves it.
   */
  public set query(query: PageQueryFunction<T, F> | null) {
    this._query = query;
    this.reloadSubject.next();
  }

  /**
   * Goes back to the first page and retrieves it again.
   */
  public reload() {
    this.reloadSubject.next();
  }

  public connect(): Observable<T[]> {
    if (!this.connected) {
      this.connected = true;
      this.updateChangeSubscription();
    }
    return this.rows;
  }

  public disconnect() {
    this.connected = false;
    this.changeSubscription?.unsubscribe();
    this.changeSubscription = null;
  }

  private updateChangeSubscription() {
    if (!this.connected) {
      return;
    }

    // Changing the sort or filter changes the rows on every page
    const restart: Observable<unknown> = merge<unknown[]>(
      this._sort ? this._sort.sortChange : EMPTY,
      this.filterSubject.pipe(skip(1)),
      this.reloadSubject
    ).pipe(tap(() => this.firstPage()));
    const pageChange: Observable<unknown> = this._paginator?.page ?? EMPTY;

    this.changeSubscription?.unsubscribe();
    this.changeSubscription = merge(restart, pageChange).pipe(
      startWith(null),
      map(() => this.createPageQuery()),
      switchMap(query => from(this.load(query)))
    ).subscribe(page => {
      if (this._paginator) {
        this._paginator.length = page.total;
      }
      this.rows.next(page.rows);
    });
  }

  private firstPage() {
    if (this._paginator) {
      // Set directly, firstPage() would emit a page event and query twice
      this._paginator.pageIndex = 0;
    }
  }

  private createPageQuery(): IPageQuery<F> {
    return {
      sort: {
        active: this._sort?.active ?? '',
        direction: this._sort?.direction ?? ''
      },
      pageIndex: this._paginator?.pageIndex ?? 0,
      pageSize: this._paginator?.pageSize ?? Number.MAX_SAFE_INTEGER,
      filter: this.filterSubject.value
    };
  }

  private async load(query: IPageQuery<F>): Promise<IPage<T>> {
    if (!this._query) {
      return { total: 0, rows: [] };
    }

    this.loadingSubject.next(this.loadingSubject.value + 1);
    try {
      return await this._query(query);
    } catch (error) {
      console.error('Could not retrieve page', query, error);
      return { total: 0, rows: [] };
    } finally {
      this.loadingSubject.next(this.loadingSubject.value - 1);
    }
  }
}

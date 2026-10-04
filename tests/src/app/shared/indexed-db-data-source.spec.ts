import { EventEmitter } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { IndexedDbDataSource, IPageQuery } from 'src/app/shared/indexed-db-data-source';

describe('IndexedDbDataSource', () => {
  let dataSource: IndexedDbDataSource<number, string>;
  let sort: { active: string; direction: string; sortChange: EventEmitter<Sort> };
  let paginator: { pageIndex: number; pageSize: number; length: number; page: EventEmitter<PageEvent> };
  let queries: IPageQuery<string>[];
  let rows: number[];

  beforeEach(() => {
    sort = { active: 'name', direction: 'asc', sortChange: new EventEmitter() };
    paginator = { pageIndex: 0, pageSize: 2, length: 0, page: new EventEmitter() };
    queries = [];
    rows = undefined;

    dataSource = new IndexedDbDataSource<number, string>('');
    dataSource.sort = sort as unknown as MatSort;
    dataSource.paginator = paginator as unknown as MatPaginator;
    dataSource.query = async query => {
      queries.push(query);
      const all = [1, 2, 3, 4, 5];
      const offset = query.pageIndex * query.pageSize;
      return { total: all.length, rows: all.slice(offset, offset + query.pageSize) };
    };
  });

  afterEach(() => dataSource.disconnect());

  async function connect() {
    dataSource.connect().subscribe(value => rows = value);
    await settle();
  }

  it('retrieves the first page when connected', async () => {
    await connect();

    expect(queries).toEqual([{ sort: { active: 'name', direction: 'asc' }, pageIndex: 0, pageSize: 2, filter: '' }]);
    expect(rows).toEqual([1, 2]);
    expect(paginator.length).toBe(5);
  });

  it('retrieves another page', async () => {
    await connect();

    paginator.pageIndex = 2;
    paginator.page.emit({ pageIndex: 2, previousPageIndex: 0, pageSize: 2, length: 5 });
    await settle();

    expect(queries.length).toBe(2);
    expect(rows).toEqual([5]);
  });

  it('goes back to the first page when the sort changes', async () => {
    await connect();
    paginator.pageIndex = 1;

    sort.direction = 'desc';
    sort.sortChange.emit({ active: 'name', direction: 'desc' });
    await settle();

    expect(paginator.pageIndex).toBe(0);
    expect(queries[1]).toEqual({ sort: { active: 'name', direction: 'desc' }, pageIndex: 0, pageSize: 2, filter: '' });
  });

  it('goes back to the first page when the filter changes', async () => {
    await connect();
    paginator.pageIndex = 1;

    dataSource.filter = 'a';
    await settle();

    expect(paginator.pageIndex).toBe(0);
    expect(queries[1].filter).toBe('a');
  });

  it('shows an empty page when the query fails', async () => {
    spyOn(console, 'error');
    await connect();

    dataSource.query = () => Promise.reject(new Error('Broken'));
    await settle();

    expect(rows).toEqual([]);
    expect(paginator.length).toBe(0);
  });
});

function settle() {
  return new Promise(resolve => setTimeout(resolve));
}

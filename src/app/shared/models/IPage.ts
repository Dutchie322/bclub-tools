export interface IPage<T> {
  // Total number of rows over all pages
  total: number;
  rows: T[];
}

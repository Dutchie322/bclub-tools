import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

function parseQuery(queryString: string): { [key: string]: string } {
  const query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (const pair of pairs) {
    const split = pair.split('=');
    query[decodeURIComponent(split[0])] = decodeURIComponent(split[1] || '');
  }
  return query;
}

@Injectable()
export class QueryPathRouterGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, snapshot: RouterStateSnapshot): Observable<boolean> | boolean {
    let page = parseQuery(window.location.search).page;

    if (!page) {
      page = '/popup';
    }

    this.router.navigate([page]);
    return false;
  }

}

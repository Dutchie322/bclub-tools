import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class QueryPathRouterGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, _: RouterStateSnapshot): Observable<boolean>|boolean {

    let page = route.queryParams.page;

    if (!page) {
      page = 'popup';
    }

    this.router.navigate(['/' + page]);
    return false;
  }

}

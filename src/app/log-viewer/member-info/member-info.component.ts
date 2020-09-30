import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { retrieveMember } from 'projects/background/src/member';
import { IMember, addOrUpdateObjectStore } from 'models';
import { FormGroup, FormControl } from '@angular/forms';
import { map, debounceTime, switchMap, switchMapTo, tap } from 'rxjs/operators';
import { Subscription, Observable, from } from 'rxjs';

@Component({
  selector: 'app-member-info',
  templateUrl: './member-info.component.html',
  styleUrls: ['./member-info.component.scss']
})
export class MemberInfoComponent implements OnDestroy {
  private formSubscription: Subscription;
  private playerCharacter: number;
  private memberNumber: number;

  public member: IMember;

  public memberForm = new FormGroup({
    notes: new FormControl('')
  });

  constructor(route: ActivatedRoute) {
    route.paramMap.subscribe(async params => {
      this.playerCharacter = +params.get('playerCharacter');
      this.memberNumber = +params.get('memberNumber');
      // TODO convert this to map()
      this.member = await retrieveMember(this.playerCharacter, this.memberNumber);
      this.memberForm.patchValue({
        notes: this.member.notes
      }, {
        emitEvent: false
      });
    });

    this.formSubscription = this.memberForm.valueChanges.pipe(
      debounceTime(1000),
      tap(async value => {
        const member = await retrieveMember(this.playerCharacter, this.memberNumber);
        member.notes = value.notes;
        await addOrUpdateObjectStore('members', member);
        console.log('stored:');
        console.log(member);
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.formSubscription.unsubscribe();
  }

  public absolute(x: number) {
    return Math.abs(x);
  }
}

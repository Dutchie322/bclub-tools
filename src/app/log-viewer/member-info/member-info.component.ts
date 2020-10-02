import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { retrieveMember } from 'projects/background/src/member';
import { IMember, addOrUpdateObjectStore } from 'models';
import { FormGroup, FormControl } from '@angular/forms';
import { debounceTime, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-member-info',
  templateUrl: './member-info.component.html',
  styleUrls: ['./member-info.component.scss']
})
export class MemberInfoComponent implements OnDestroy {
  private formSubscription: Subscription;
  private playerCharacter: number;
  private memberNumber: number;

  @ViewChild('appearanceImage', { static: true })
  public appearanceImageElement: ElementRef<HTMLImageElement>;

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
      if (this.member.appearance) {
        this.appearanceImageElement.nativeElement.src = this.member.appearance;
      }
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

  public lovershipStageToName(stage: number) {
    switch (stage) {
      case 0: return 'Dating';
      case 1: return 'Engaged';
      case 2: return 'Married';
    }
    return stage;
  }

  public ownershipStageToName(stage: number) {
    switch (stage) {
      case 0: return 'On trial';
      case 1: return 'Collared';
    }
    return stage;
  }

  public timeToDays(start: Date) {
    return Math.floor((new Date().getTime() - start.getTime()) / 86400000).toString();
  }
}

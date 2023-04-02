import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, tap, map, switchMap, mergeMap } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';
import { IMember, addOrUpdateObjectStore, decompress } from 'models';
import { MemberService } from 'src/app/shared/member.service';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-member-info',
  templateUrl: './member-info.component.html',
  styleUrls: ['./member-info.component.scss']
})
export class MemberInfoComponent implements OnDestroy {
  private formSubscription: Subscription;
  private playerCharacter: number;
  private memberNumber: number;
  private member: IMember;

  public member$: Observable<IMember>;

  public imageContainerStyle: NgStyle['ngStyle'];
  public imageStyle: NgStyle['ngStyle'];
  public memberForm = new FormGroup({
    notes: new FormControl('')
  });

  public decompress = decompress;

  constructor(
    route: ActivatedRoute,
    memberService: MemberService,
    private snackBar: MatSnackBar
  ) {
    this.member$ = route.paramMap.pipe(
      map(params => ({
        playerCharacter: +params.get('playerCharacter'),
        memberNumber: +params.get('memberNumber')
      })),
      tap(params => {
        this.playerCharacter = params.playerCharacter;
        this.memberNumber = params.memberNumber;
      }),
      switchMap(params => memberService.retrieveMember(params.playerCharacter, params.memberNumber)),
      tap(member => this.memberForm.patchValue({ notes: member.notes }, { emitEvent: false })),
      tap(member => this.member = member)
    );

    this.formSubscription = this.memberForm.valueChanges.pipe(
      debounceTime(1000),
      switchMap(values => memberService.retrieveMember(this.playerCharacter, this.memberNumber).pipe(
        map(member => ({ ...member, notes: values.notes } as IMember)),
      )),
      mergeMap(member => addOrUpdateObjectStore('members', member)),
      tap(member => {
        this.snackBar.open(`Notes for ${member.memberName} saved`, undefined, {
          duration: 2000,
        });
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.formSubscription.unsubscribe();
  }

  public absolute(x: number) {
    return Math.abs(x);
  }

  public calculateAppearanceImageStyles(imageElement: HTMLImageElement) {
    const imageContainerStyle: NgStyle['ngStyle'] = {
      height: '1000px'
    };
    const imageStyle: NgStyle['ngStyle'] = {
      position: 'relative'
    };

    const metaData = this.member.appearanceMetaData;
    if (!metaData) {
      if (imageElement.height > 1000) {
        imageContainerStyle.overflow = 'auto';
      }
    } else {
      imageContainerStyle.overflow = 'hidden';

      if (metaData.isInverted) {
        imageStyle.transform = 'rotate(180deg)';
      }

      const offsetY = metaData.heightRatioProportion - metaData.heightModifier;
      const startY = 700 - offsetY;
      const sourceHeight = 1000;
      const sourceY = metaData.isInverted ? metaData.canvasHeight - (startY + sourceHeight) : startY;
      // const offsetY = 1000 * (1 - metaData.heightRatio) * metaData.heightRatioProportion - metaData.heightModifier *
      // metaData.heightRatio;
      // const startY = 700 - offsetY / metaData.heightRatio;
      // const sourceHeight = 1000 / metaData.heightRatio;
      // const sourceY = metaData.isInverted ? metaData.canvasHeight - (startY + sourceHeight) : startY;
      // sourceY += 63;
      imageStyle.top = `-${sourceY}px`;
    }

    this.imageContainerStyle = imageContainerStyle;
    this.imageStyle = imageStyle;
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

  public pronouns(member: IMember) {
    const value = member.pronouns;
    switch (value) {
      case 'SheHer':
        return 'She/Her';
      case 'HeHim':
        return 'He/Him';
      default:
        return value;
    }
  }

  public timeToDays(start: Date) {
    return Math.floor((new Date().getTime() - start.getTime()) / 86400000).toString();
  }
}

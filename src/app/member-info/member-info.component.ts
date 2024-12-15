import { Component, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, tap, map, switchMap, mergeMap } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';
import { IMember, addOrUpdateObjectStore, decompress, findTitle } from 'models';
import { MemberService } from 'src/app/shared/member.service';
import { CommonModule, NgStyle } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-member-info',
    imports: [
      CommonModule,
      ReactiveFormsModule,
      MatIcon,
      MatListModule,
      MatTabsModule,
      MatToolbar,
    ],
    templateUrl: './member-info.component.html',
    styleUrls: ['./member-info.component.scss']
})
export class MemberInfoComponent implements OnDestroy {
  private formSubscription: Subscription;
  private playerCharacter: number;
  private memberNumber: number;
  private member: IMember;
  private titlePromise: Promise<string>;

  public member$: Observable<IMember>;

  public imageContainerStyle: NgStyle['ngStyle'];
  public imageStyle: NgStyle['ngStyle'];
  public memberForm = new UntypedFormGroup({
    notes: new UntypedFormControl('')
  });

  public decompress = decompress;

  constructor(
    route: ActivatedRoute,
    memberService: MemberService,
    private snackBar: MatSnackBar,
    title: Title
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
      tap(member => this.member = member),
      tap(member => title.setTitle(`${member.memberName} (${member.memberNumber}) - Bondage Club Tools`))
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

  public calculateAppearanceImageStyles(element: EventTarget) {
    const imageElement = element as HTMLImageElement;
    const imageContainerStyle: NgStyle['ngStyle'] = {
      height: '1000px'
    };
    const imageStyle: NgStyle['ngStyle'] = {
      position: 'relative',
      marginLeft: '50%',
      transform: 'translateX(-50%)'
    };

    const metaData = this.member.appearanceMetaData;
    if (!metaData) {
      if (imageElement.height > 1000) {
        imageContainerStyle['overflow'] = 'auto';
      }
    } else {
      imageContainerStyle['overflow'] = 'hidden';

      if (metaData.isInverted) {
        imageStyle['transform'] = 'rotate(180deg)';
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
      imageStyle['top'] = `-${sourceY}px`;
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

  public title(member: IMember) {
    if (!this.titlePromise) {
      this.titlePromise = findTitle(member.title || 'None');
    }

    return this.titlePromise;
  }

  public timeToDays(start: Date) {
    return Math.floor((new Date().getTime() - start.getTime()) / 86400000).toString();
  }

  public difficulty(difficulty: number) {
    switch (difficulty) {
      case 0:
        return 'Roleplay';
      default:
      case 1:
        return 'Regular';
      case 2:
        return 'Hardcore';
      case 3:
        return 'Extreme';
    }
  }
}

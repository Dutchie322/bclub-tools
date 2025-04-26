import { Component, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, tap, map, switchMap, mergeMap, catchError, filter } from 'rxjs/operators';
import { Subscription, Observable, of } from 'rxjs';
import { Appearance, IBeepMessage, IMember, IMemberAppearanceMetaData, SharedRoom, putValue, decompress, findTitle, retrieveAppearanceWithFallback, retrieveBeepMessages, retrieveSharedRooms } from 'models';
import { MemberService } from 'src/app/shared/member.service';
import { CommonModule, NgStyle } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

type BeepMessageView = Partial<IBeepMessage> & { break?: boolean };

@Component({
  selector: 'app-member-info',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIcon,
    MatListModule,
    MatTabsModule,
    MatToolbar,
    RouterLink
  ],
  templateUrl: './member-info.component.html',
  styleUrls: ['./member-info.component.scss']
})
export class MemberInfoComponent implements OnDestroy {
  private formSubscription: Subscription;
  public playerCharacter: number;
  private memberNumber: number;
  private titlePromise: Promise<string>;

  public member$: Observable<IMember | undefined>;
  public appearance$: Observable<Appearance | undefined>;
  public beepMessages$: Observable<BeepMessageView[]>;
  public sharedRooms$: Observable<SharedRoom[]>;
  public isError = false;
  public selectedTab: number;

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
      switchMap(params => {
        this.playerCharacter = +params.get('playerCharacter');
        this.memberNumber = +params.get('memberNumber');
        this.isError = false;
        this.snackBar.dismiss();

        return memberService.retrieveMember(this.playerCharacter, this.memberNumber).pipe(
          catchError(err => {
            this.snackBar.open(err, undefined, {
              verticalPosition: 'top'
            });

            this.isError = true;
            this.memberForm.patchValue({ notes: '' }, { emitEvent: false });
            title.setTitle(`${this.memberNumber} not found - Bondage Club Tools`);

            return of(undefined);
          }));
      }),
      tap(member => {
        if (this.isError) {
          return;
        }

        this.selectedTab = 0;
        this.memberForm.patchValue({ notes: member.notes }, { emitEvent: false });
        title.setTitle(`${member.nickname || member.memberName} (${member.memberNumber}) - Bondage Club Tools`);
      })
    );

    this.appearance$ = route.paramMap.pipe(
      switchMap(params => {
        const playerCharacter = +params.get('playerCharacter');
        const memberNumber = +params.get('memberNumber');

        return retrieveAppearanceWithFallback(playerCharacter, memberNumber);
      })
    );

    this.beepMessages$ = route.paramMap.pipe(
      switchMap(params => {
        const playerCharacter = +params.get('playerCharacter');
        const memberNumber = +params.get('memberNumber');

        return retrieveBeepMessages(playerCharacter, memberNumber);
      }),
      filter(messages => messages.length > 0),
      map(messages => messages.reverse()),
      map(messages => {
        let newerMessage = messages[0];
        const results: BeepMessageView[] = [newerMessage];
        for (let i = 1; i < messages.length; i++) {
          const olderMessage = messages[i];
          if (newerMessage.timestamp.valueOf() - olderMessage.timestamp.valueOf() > 4 * 3600 * 1000) {
            results.push({ break: true });
          }

          results.push(olderMessage);
          newerMessage = olderMessage;
        }

        return results;
      })
    );

    this.sharedRooms$ = route.paramMap.pipe(
      switchMap(params => {
        const playerCharacter = +params.get('playerCharacter');
        const memberNumber = +params.get('memberNumber');

        return retrieveSharedRooms(playerCharacter, memberNumber);
      }),
      map(rooms => rooms.sort((a, b) => b.startDate.valueOf() - a.startDate.valueOf()))
    );

    this.formSubscription = this.memberForm.valueChanges.pipe(
      debounceTime(1000),
      switchMap(values => memberService.retrieveMember(this.playerCharacter, this.memberNumber).pipe(
        map(member => ({ ...member, notes: values.notes } as IMember)),
      )),
      mergeMap(member => putValue('members', member)),
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

  public calculateAppearanceImageStyles(metaData: IMemberAppearanceMetaData, element: EventTarget) {
    const imageElement = element as HTMLImageElement;
    const imageContainerStyle: NgStyle['ngStyle'] = {
      height: '1100px',
      display: 'flex',
      'flex-wrap': 'wrap',
      'justify-content': 'center',
    };
    const imageStyle: NgStyle['ngStyle'] = {};

    if (!metaData) {
      if (imageElement.height > 1000) {
        imageContainerStyle['overflow'] = 'auto';
        setTimeout(() => {
          imageElement.parentElement.scrollTop = 700;
        });
      }
    } else {
      imageContainerStyle['overflow-x'] = 'visible';
      imageContainerStyle['overflow-y'] = 'clip';
      imageContainerStyle['z-index'] = '-1';

      const heightDiff = (1 - metaData.heightRatio) * 1000;
      const startY = 700 + metaData.heightModifier;
      const sourceHeight = 1000;
      const sourceY = metaData.isInverted ? metaData.canvasHeight - (startY + sourceHeight - (heightDiff * metaData.heightRatio)) : startY - heightDiff;

      let transform = `translateY(-${sourceY}px) `;
      if (metaData.isInverted) {
        transform += ' rotate(180deg)';
      }

      transform += `scale(${metaData.heightRatio})`;

      imageStyle['transform'] = transform;
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

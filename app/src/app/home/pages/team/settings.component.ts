/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy, HostListener } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { isEqual } from 'lodash-es';
import { Subscription, timer } from 'rxjs';
import { ApiService } from 'src/app/core/services';
import { ETeamRole } from 'src/app/core/models/commontypes';
import type { TeamLookupResponse } from 'src/app/core/models/commontypes';
import { TeamPageTabType, TeamPageService } from './team.service';
import { ConfirmComponent, ConfirmElements } from 'src/app/home/components/confirm.component';

interface IFormContent {
  name: string;
  slug: string;
}

enum AlertType {
  Success = 'success',
  Danger = 'danger'
}

type Alert = { type: AlertType, msg: string, close?: boolean };

enum EModalType {
  ChangeName = 'changeTeamName',
  ChangeSlug = 'changeTeamSlug',
  LeaveTeam = 'leaveTeam',
  DeleteTeam = 'deleteTeam'
}

@Component({
  selector: 'app-team-tab-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class TeamTabSettingsComponent implements OnDestroy {

  alert: Partial<Record<EModalType, Alert>> = {};

  protected submitted: boolean;
  public formName: FormGroup;
  public formSlug: FormGroup;

  team: TeamLookupResponse;

  private _confirmModalRef: NgbModalRef;
  private _subTeam: Subscription;

  ETeamRole = ETeamRole;
  EModalType = EModalType;

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    private teamPageService: TeamPageService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal
  ) {
    this._subTeam = this.teamPageService.team$.subscribe(team => {
      this.team = team;
      this.formName.setValue({ name: team.name });
      this.formSlug.setValue({ slug: team.slug });
    });
    this.formName = new FormGroup({
      name: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(32)
        ],
        updateOn: 'blur'
      })
    });
    this.formSlug = new FormGroup({
      slug: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(16),
          Validators.pattern('[a-zA-Z][a-zA-Z0-9\-]+')
        ],
        updateOn: 'blur'
      })
    });
  }

  /**
   *
   */
  ngOnDestroy() {
    this._subTeam.unsubscribe();
  }

  /**
   *
   */
  async onSubmit(type: EModalType, model: IFormContent) {
    switch (type) {
      case EModalType.ChangeName:
        if (!this.formName.valid) {
          break;
        }
        if (isEqual(this.team.name, model.name)) {
          break;
        }
        this.updateTeamName(model.name);
        break;

      case EModalType.ChangeSlug:
        if (!this.formSlug.valid) {
          break;
        }
        if (isEqual(this.team.slug, model.slug)) {
          break;
        }
        this.updateTeamSlug(model.slug);
        break;
    }
    this.submitted = true;
  }

  /**
   *
   */
  async openConfirmModal(type: EModalType) {
    this._confirmModalRef = this.modalService.open(ConfirmComponent);
    if (type === EModalType.DeleteTeam) {
      const elements: ConfirmElements = {
        title: `Delete Team ${this.team.name}`,
        message: `<p>
          You are about to delete team <strong>${this.team.name}</strong>.
          This action permanently removes all data associated with this team.
          Are you sure you want to delete this team?</p>`,
        button: 'Delete'
      };
      this._confirmModalRef.componentInstance.elements = elements;
    } else if (type === EModalType.LeaveTeam) {
      const elements: ConfirmElements = {
        title: `Leave Team ${this.team.name}`,
        message: `<p>
          You are about to leave team <strong>${this.team.name}</strong>.
          Once you leave a team, you need a new invitation to join back
          in the future. Are you sure you want to leave this team?</p>`,
        button: 'Leave'
      };
      this._confirmModalRef.componentInstance.elements = elements;
    }
    this._confirmModalRef.result
      .then((state: boolean) => {
        if (!state) {
          return;
        }
        switch (type) {
          case EModalType.DeleteTeam:
            return this.deleteTeam();
          case EModalType.LeaveTeam:
            return this.leaveTeam();
        }
      })
      .catch(_e => true);
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    event.stopImmediatePropagation();
  }

  /**
   *
   */
  private extractError(err: HttpErrorResponse) {
    return this.apiService.extractError(err, [
      [ 400, 'request invalid', 'Your request was rejected by the server.' ],
      [ 401, 'auth failed', 'Your authorization key has expired. Please sign in again.' ],
      [ 403, 'insufficient privileges', 'You must be the owner of this team to perform this operation.' ],
      [ 404, 'team not found', 'This team has been removed.' ],
      [ 409, 'team already registered', 'There is already a team with this slug.' ]
    ]);
  }

  /**
   *
   */
  private updateTeamName(name: string) {
    const url = [ 'team', this.team.slug ].join('/');
    this.apiService.patch(url, { name }).subscribe(
      () => {
        this.alert.changeTeamName = {
          type: AlertType.Success, msg: 'Team name was updated.'
        };
        timer(5000).subscribe(() => this.alert.changeTeamName.close = true);
        this.teamPageService.updateTeamSlug(TeamPageTabType.Settings, this.team.slug);
      },
      (err: HttpErrorResponse) => {
        this.alert.changeTeamName = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

  /**
   *
   */
  private updateTeamSlug(slug: string) {
    const url = [ 'team', this.team.slug ].join('/');
    this.apiService.patch(url, { slug }).subscribe(
      () => {
        this.alert.changeTeamSlug = {
          type: AlertType.Success, msg: 'Team slug was updated.'
        };
        timer(5000).subscribe(() => this.alert.changeTeamSlug.close = true);
        this.teamPageService.updateTeamSlug(TeamPageTabType.Settings, slug);
        this.router.navigate([ '~', slug ]);
      },
      (err: HttpErrorResponse) => {
        this.alert.changeTeamSlug = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

  /**
   *
   */
  public deleteTeam() {
    const url = [ 'team', this.team.slug ].join('/');
    this.apiService.delete(url).subscribe(
      () => {
        this.router.navigate(['..'], {relativeTo: this.route });
      },
      (err: HttpErrorResponse) => {
        this.alert.deleteTeam = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

  /**
   *
   */
  public leaveTeam() {
    const url = [ 'team', this.team.slug, 'leave' ].join('/');
    this.apiService.post(url).subscribe(
      () => {
        this.router.navigate(['..'], {relativeTo: this.route });
      },
      (err: HttpErrorResponse) => {
        this.alert.leaveTeam = {
          type: AlertType.Danger, msg: this.extractError(err)
        };
      });
  }

}

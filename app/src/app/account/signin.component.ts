// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, NgZone, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';

import { formFields } from '@/core/models/form-hint';
import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { ApiService, AuthService, UserService } from '@/core/services';
import { Alert, AlertType } from '@/shared/components/alert.component';

interface FormContent {
  uname: string;
  upass: string;
}

@Component({
  selector: 'app-account-signin',
  templateUrl: './signin.component.html'
})
export class SigninComponent implements OnInit {
  formSignin = new FormGroup({
    uname: new FormControl('', {
      validators: formFields.uname.validators,
      updateOn: 'change'
    }),
    upass: new FormControl('', {
      validators: formFields.upass.validators,
      updateOn: 'change'
    })
  });

  alert: Alert;
  submitted: boolean;
  prev: FormContent;
  selfHosted = environment.self_hosted;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private userService: UserService,
    private zone: NgZone
  ) {}

  ngOnInit() {
    const queryMap = this.route.snapshot.queryParamMap;
    if (queryMap.has('e') && queryMap.get('e') === '401') {
      this.alert = {
        type: AlertType.Info,
        text: 'Your session expired. Please login once again.'
      };
    } else if (queryMap.has('n') && queryMap.get('n') === 'join') {
      this.alert = {
        type: AlertType.Info,
        text: 'Please sign in to respond to your team invitation.'
      };
    }
  }

  onSubmit(model: FormContent) {
    if (this.formSignin.pristine) {
      return;
    }
    if (!this.formSignin.valid) {
      this.alert = {
        type: AlertType.Danger,
        text: 'Incorrect username or password.'
      };
      return;
    }
    if (this.prev === model) {
      return;
    }
    this.authService.login(model.uname, model.upass).subscribe({
      next: () => {
        this.userService.populate();
        this.formSignin.reset();
        this.prev = null;
        const callback = localStorage.getItem(ELocalStorageKey.Callback);
        if (callback) {
          this.router.navigateByUrl(callback);
          return;
        }
        this.router.navigate([this.authService.redirectUrl ?? '/~']);
      },
      error: (err: HttpErrorResponse) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.'],
          [401, 'invalid login credentials', 'Incorrect username or password.'],
          [423, 'account suspended', 'Your account is currently suspended.'],
          [423, 'account locked', 'Your account is temporarily locked.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
        this.prev = model;
      }
    });
  }

  signinGoogle() {
    this.authService.google_login().subscribe({
      next: () => {
        this.userService.populate();
        this.prev = null;
        const callback = localStorage.getItem(ELocalStorageKey.Callback);
        this.zone.run(() => {
          if (callback) {
            this.router.navigateByUrl(callback);
            return;
          }
          this.router.navigate([this.authService.redirectUrl ?? '/~']);
        });
      },
      error: (err: HttpErrorResponse) => {
        const msg = this.apiService.extractError(err, [
          [
            403,
            'feature not available',
            'Feature not available for self-hosted deployments.'
          ],
          [401, 'account not verified', 'Your Google account is not verified.'],
          [423, 'account suspended', 'Your account is currently suspended.'],
          [423, 'account locked', 'Your account is temporarily locked.']
        ]);
        this.zone.run(() => {
          this.alert = { type: AlertType.Danger, text: msg };
        });
      }
    });
  }
}

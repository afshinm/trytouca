/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import type { SuiteLookupResponse, Promotion } from 'src/app/core/models/commontypes';
import type { FrontendBatchCompareParams, FrontendElementCompareParams } from 'src/app/core/models/frontendtypes';
import { NotificationService, NotificationType } from 'src/app/core/services';

type ParamsType = FrontendBatchCompareParams | FrontendElementCompareParams;

@Component({
  selector: 'app-home-version-navigator',
  templateUrl: './version-navigator.component.html',
  styleUrls: ['./version-navigator.component.scss']
})
export class VersionNavigatorComponent {

  faLink = faLink;

  @Input() suite: SuiteLookupResponse;
  @Input() params: ParamsType;

  /**
   *
   */
  constructor(private notificationService: NotificationService) {
  }

  /**
   *
   */
  private isElementParams(type: ParamsType): type is FrontendElementCompareParams {
    return 'srcElementSlug' in type;
  }

  /**
   *
   */
  get baseline(): Promotion {
    return this.suite.promotions.slice(-1)[0];
  }

  /**
   *
   */
  get link() {
    const base = `${window.location.origin}/~/${this.params.teamSlug}`;
    if (!this.isElementParams(this.params)) {
      return `${base}/${this.params.srcSuiteSlug}`
        + `?v=${this.params.srcBatchSlug}`
        + `&cv=${this.params.dstBatchSlug}`;
    }
    return `${base}/${this.params.srcSuiteSlug}/${this.params.srcElementSlug}`
      + `?v=${this.params.srcBatchSlug}`
      + `&cv=${this.params.dstBatchSlug}`;
  }

  /**
   *
   */
  public onCopy(event: string) {
    this.notificationService.notify(NotificationType.Success, 'Copied value to clipboard.');
  }

}

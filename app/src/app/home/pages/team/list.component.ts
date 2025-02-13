// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { Subscription } from 'rxjs';

import { TeamLookupResponse } from '@/core/models/commontypes';
import { PageListComponent } from '@/home/components/page-list.component';
import { FilterInput } from '@/home/models/filter.model';
import { TopicType } from '@/home/models/page-item.model';

import { TeamCreateSuiteComponent } from './create-suite.component';
import { TeamPageSuite, TeamPageSuiteType } from './team.model';
import { TeamPageService } from './team.service';

const filterInput: FilterInput<TeamPageSuite> = {
  filters: [
    {
      key: 'none',
      name: 'None',
      func: () => true
    },
    {
      key: 'different',
      name: 'Different',
      func: (a) =>
        a.data.overview && a.data.overview.elementsScoreAggregate !== 1
    },
    {
      key: 'faster',
      name: 'Faster',
      func: (a) => a.data.overview && a.data.overview.metricsDurationSign < 1
    },
    {
      key: 'slower',
      name: 'Slower',
      func: (a) => a.data.overview && a.data.overview.metricsDurationSign > 1
    },
    {
      key: 'stale',
      name: 'Stale',
      func: (a) => {
        if (!a.data.latest || !a.data.latest.submittedAt) {
          return false;
        }
        const d1 = new Date(a.data.latest.submittedAt);
        const d2 = new Date();
        return 12096e5 < d2.getTime() - d1.getTime();
      }
    }
  ],
  sorters: [
    {
      key: 'date',
      name: 'Date',
      func: (a, b) => {
        if (!a.data.latest || !a.data.latest.submittedAt) {
          return 1;
        }
        if (!b.data.latest || !b.data.latest.submittedAt) {
          return -1;
        }
        return (
          +new Date(b.data.latest.submittedAt) -
          +new Date(a.data.latest.submittedAt)
        );
      }
    },
    {
      key: 'score',
      name: 'Match Rate',
      func: (a, b) => {
        if (!a.data.overview) {
          return -1;
        }
        if (!b.data.overview) {
          return 1;
        }
        return (
          b.data.overview.elementsScoreAggregate -
          a.data.overview.elementsScoreAggregate
        );
      }
    },
    {
      key: 'name',
      name: 'Name',
      func: (a, b) => b.data.suiteName.localeCompare(a.data.suiteName)
    },
    {
      key: 'count',
      name: 'Number of Cases',
      func: (a, b) => {
        if (!a.data.overview) {
          return 1;
        }
        if (!b.data.overview) {
          return -1;
        }
        return (
          b.data.overview.elementsCountHead - a.data.overview.elementsCountHead
        );
      }
    },
    {
      key: 'duration',
      name: 'Duration',
      func: (a, b) => {
        if (!a.data.overview) {
          return 1;
        }
        if (!b.data.overview) {
          return -1;
        }
        return (
          b.data.overview.metricsDurationHead -
          a.data.overview.metricsDurationHead
        );
      }
    }
  ],
  searchBy: ['_data.suiteName', '_data.suiteSlug'],
  defaults: {
    filter: 'none',
    search: '',
    sorter: 'date',
    order: 'dsc',
    pagen: 1,
    pagel: 100
  },
  queryKeys: {
    filter: 'f',
    search: 'q',
    sorter: 's',
    order: 'o',
    pagen: 'n',
    pagel: 'l'
  },
  placeholder: 'Find a suite'
};

@Component({
  selector: 'app-team-tab-suites',
  templateUrl: './list.component.html'
})
export class TeamTabSuitesComponent
  extends PageListComponent<TeamPageSuite>
  implements OnDestroy
{
  ItemType = TeamPageSuiteType;
  chosenTopic: TopicType;
  private _dialogRef: DialogRef;
  private _dialogSub: Subscription;
  private _team: TeamLookupResponse;
  private _subTeam: Subscription;

  constructor(
    private dialogService: DialogService,
    private teamPageService: TeamPageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, Object.values(TeamPageSuiteType), route, router);
    this._subTeam = teamPageService.data.team$.subscribe((v) => {
      this._team = v;
    });
    this._subAllItems = teamPageService.items$.subscribe((v) => {
      this.initCollections(v);
    });
  }

  ngOnDestroy() {
    if (this._dialogSub) {
      this._dialogSub.unsubscribe();
    }
    this._subTeam.unsubscribe();
    super.ngOnDestroy();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate
    // through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-team-tab-suites');
      return;
    }
    const row = this.selectedRow;
    // pressing 'escape' when an item is selected should unselect it
    if ('Escape' === event.key && row !== -1) {
      this.selectedRow = -1;
    }
    // pressing 'enter' when an item is selected should route to the next page
    if ('Enter' === event.key && row !== -1) {
      this.router.navigate([this._items[row].data.suiteSlug], {
        relativeTo: this.route,
        queryParams: {}
      });
    }
  }

  updateChosenTopics(type: TopicType) {
    this.chosenTopic = type;
  }

  openCreateModal() {
    this._dialogRef = this.dialogService.open(TeamCreateSuiteComponent, {
      closeButton: false,
      data: { teamSlug: this._team.slug },
      minHeight: '10vh'
    });
    this._dialogSub = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (state) {
          this.teamPageService.refreshSuites();
        }
      }
    );
  }
}

import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * Service for managing service worker updates and online/offline status.
 * Detects when new versions are available and provides network status information.
 */
@Injectable({
  providedIn: 'root'
})
export class SwUpdateService {
  private updateAvailableSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable that emits true when an update is available.
   */
  public readonly updateAvailable$: Observable<boolean> = this.updateAvailableSubject.asObservable();

  /**
   * Observable that emits the current online/offline status.
   */
  public readonly isOnline$: Observable<boolean>;

  constructor(private swUpdate: SwUpdate) {
    // Listen for online/offline events
    this.isOnline$ = merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(
      startWith(navigator.onLine)
    );

    // Listen for available updates
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          this.updateAvailableSubject.next(true);
        }
      });
    }
  }

  /**
   * Manually check for available updates.
   * Only works if the service worker is enabled.
   */
  public async checkForUpdates(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.checkForUpdate();
    }
  }

  /**
   * Activate an available update and reload the page.
   * This will apply the new version of the application.
   */
  public async activateUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.activateUpdate();
      window.location.reload();
    }
  }
}

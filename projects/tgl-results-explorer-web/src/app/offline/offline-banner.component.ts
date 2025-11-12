import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { SwUpdateService } from './sw-update.service';

/**
 * Component that displays banners for offline status and available updates.
 * Shows an offline banner when the network is unavailable.
 * Shows an update banner when a new version of the app is available.
 */
@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="offline-banner" *ngIf="isOffline | async" role="status" aria-live="polite">
  <span class="icon">⚠️</span>
  <p>You are offline. The app will continue to work with cached data.</p>
</div>

<div class="update-banner" *ngIf="updateAvailable | async" role="status" aria-live="polite">
  <span class="icon">ℹ️</span>
  <p>A new version is available.</p>
  <button (click)="onUpdateClick()">Update</button>
</div>
  `,
  styles: [`
.offline-banner,
.update-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-out;
}

@media (max-width: 768px) {
  .offline-banner,
  .update-banner {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }
}

.offline-banner .icon,
.update-banner .icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.offline-banner p,
.update-banner p {
  margin: 0;
  flex: 1;
  text-align: center;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .offline-banner p,
  .update-banner p {
    font-size: 0.85rem;
  }
}

.offline-banner button,
.update-banner button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.offline-banner button:hover,
.update-banner button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.offline-banner button:active,
.update-banner button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .offline-banner button,
  .update-banner button {
    width: 100%;
    max-width: 200px;
  }
}

.offline-banner {
  background-color: #f5f5f5;
  border-bottom: 2px solid #bdbdbd;
  color: #424242;
}

.update-banner {
  background-color: #e3f2fd;
  border-bottom: 2px solid #2196f3;
  color: #0d47a1;
}

.update-banner button {
  background-color: #2196f3;
  color: white;
}

.update-banner button:hover {
  background-color: #1976d2;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
  `]
})
export class OfflineBannerComponent {
  /**
   * Observable that emits true when the app is offline.
   */
  public readonly isOffline: Observable<boolean>;

  /**
   * Observable that emits true when an update is available.
   */
  public readonly updateAvailable: Observable<boolean>;

  constructor(private swUpdateService: SwUpdateService) {
    this.isOffline = this.swUpdateService.isOnline$.pipe(
      map(isOnline => !isOnline)
    );
    this.updateAvailable = this.swUpdateService.updateAvailable$;
  }

  /**
   * Handle click on the update button.
   * Activates the update and reloads the page.
   */
  public onUpdateClick(): void {
    this.swUpdateService.activateUpdate();
  }
}

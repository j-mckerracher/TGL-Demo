/**
 * FallbackBannerComponent.
 *
 * Displays a warning banner when the application is in fallback mode
 * (i.e., when WebGL/WebGPU is unavailable). Informs users that advanced
 * graphics features are disabled and a simplified preview is shown.
 *
 * Features:
 * - Conditional rendering based on fallback state
 * - Accessible ARIA attributes for screen readers
 * - Clear messaging about degraded functionality
 * - Responsive layout
 *
 * Version: v1.0
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FallbackService } from './fallback.service';

@Component({
  selector: 'fallback-banner',
  templateUrl: './fallback-banner.component.html',
  styleUrls: ['./fallback-banner.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class FallbackBannerComponent implements OnInit {
  /**
   * Message displayed in the banner when fallback is active.
   */
  message: string =
    'Your browser does not support advanced graphics. Displaying simplified preview.';

  /**
   * Additional details about what features are disabled.
   */
  details: string = 'Some interactive features are disabled.';

  constructor(public fallbackService: FallbackService) {}

  ngOnInit(): void {
    // Initialize fallback detection on component initialization
    this.fallbackService.initialize();
  }

  /**
   * Get the static placeholder image/message from the service.
   *
   * @returns Placeholder data URI or message
   */
  getPlaceholder(): string {
    return this.fallbackService.getStaticPlaceholder();
  }
}

/**
 * Takeaway Component.
 *
 * Displays formatted key takeaway messages comparing two simulation runs.
 * Conditionally renders based on data availability and feature flags.
 *
 * Version: v1.0
 */

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { RunSummaryV1 } from 'simulation';
import { TakeawayService, type TakeawayV1 } from './takeaway.service';

@Component({
  selector: 'takeaway',
  templateUrl: './takeaway.component.html',
  styleUrls: ['./takeaway.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class TakeawayComponent implements OnInit {
  @Input() summaryA?: RunSummaryV1;
  @Input() summaryB?: RunSummaryV1;
  @Input() includeAbsolutes: boolean = false;
  @Input() template?: string;

  takeaway?: TakeawayV1;
  message?: string;

  constructor(private takeawayService: TakeawayService) {}

  ngOnInit(): void {
    this.computeTakeaway();
  }

  /**
   * Compute takeaway metrics and format message.
   */
  private computeTakeaway(): void {
    // Guard: both summaries must be provided
    if (!this.summaryA || !this.summaryB) {
      return;
    }

    // Compute takeaway
    this.takeaway = this.takeawayService.compute(
      this.summaryA,
      this.summaryB,
      this.includeAbsolutes
    );

    // Format message
    this.message = this.takeawayService.formatMessage(
      this.takeaway,
      this.template
    );
  }
}

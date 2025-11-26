import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent {
  @Output() viewDemo = new EventEmitter<void>();

  public onViewDemoClick(): void {
    this.viewDemo.emit();
  }
}


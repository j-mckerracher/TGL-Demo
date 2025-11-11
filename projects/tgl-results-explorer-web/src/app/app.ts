import { Component, signal } from '@angular/core';
import {
  MechanismCanvasComponent,
  P2PCanvasComponent,
} from 'rendering';

@Component({
  selector: 'app-root',
  imports: [MechanismCanvasComponent, P2PCanvasComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('tgl-results-explorer-web');
}

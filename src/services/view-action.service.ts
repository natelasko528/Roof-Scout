import { Injectable, signal } from '@angular/core';

export type View = 'map' | 'list' | 'sessions';

/**
 * A service to communicate view change actions
 * from other parts of the application, like the chatbot.
 */
@Injectable({
  providedIn: 'root',
})
export class ViewActionService {
  /**
   * Set this signal to a view name to make the app
   * switch to that view.
   */
  switchView = signal<View | null>(null);
}

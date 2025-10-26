import { Injectable, signal } from '@angular/core';

/**
 * A service to communicate actions to the InteractiveMapComponent
 * from other parts of the application, like the chatbot.
 */
@Injectable({
  providedIn: 'root',
})
export class MapActionService {
  /**
   * Set this signal to a street address to make the map
   * search for and fly to that location.
   */
  flyToAddress = signal<string | null>(null);
}

import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as L from 'leaflet';
import { Tour } from '../../models/tour.model';
import { TourLog } from '../../models/tour-log.model';
import { TourLogList } from '../tour-log-list/tour-log-list';
import { AttributeField } from '../shared/attribute-field/attribute-field';

import { TourService } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tour-detail',
  imports: [TourLogList, AttributeField],
  templateUrl: './tour-detail.html',
  styleUrl: './tour-detail.css',
  host: {
    '(window:resize)': 'onWindowResize()'
  }
})
export class TourDetail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapElementRef = viewChild<ElementRef<HTMLDivElement>>('leafletMap');
  private readonly tourService = inject(TourService);
  private readonly authService = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  private map: L.Map | undefined;
  private readonly defaultCenter: L.LatLngTuple = [48.2082, 16.3738];
  private routeLayer: L.LayerGroup | undefined;
  readonly tour = input<Tour | undefined>();
  readonly logs = input<TourLog[]>([]);
  readonly addLogRequested = output<void>();
  readonly editRequested = output<Tour>();
  readonly deleteRequested = output<Tour>();
  readonly logEditRequested = output<TourLog>();
  readonly logDeleteRequested = output<TourLog>();
  readonly mapError = signal<string | undefined>(undefined);
  
  readonly imageBlobUrl = signal<SafeUrl | undefined>(undefined);
  readonly imagePath = computed(() => {
    const imageFilePath = this.tour()?.imageFilePath?.trim();
    if (!imageFilePath) return undefined;
    if (imageFilePath.startsWith('http') || imageFilePath.startsWith('blob:') || imageFilePath.startsWith('data:')) {
      return imageFilePath;
    }
    return this.imageBlobUrl();
  });
  readonly imageAlt = computed(() => `Tour image for ${this.tour()?.name ?? 'selected tour'}`);

  constructor() {
    effect((onCleanup) => {
      const currentTour = this.tour();
      const imageFilePath = currentTour?.imageFilePath?.trim();
      
      if (imageFilePath && !imageFilePath.startsWith('http') && !imageFilePath.startsWith('blob:') && !imageFilePath.startsWith('data:')) {
        const userId = this.authService.currentUserId();
        if (userId) {
          let objectUrl: string | undefined = undefined;
          let isCleanedUp = false;
          
          this.tourService.getImageBlob(userId, imageFilePath).then(blob => {
            if (isCleanedUp) return;
            objectUrl = URL.createObjectURL(blob);
            this.imageBlobUrl.set(this.sanitizer.bypassSecurityTrustUrl(objectUrl));
          }).catch(err => console.error('Failed to load image blob', err));

          onCleanup(() => {
            isCleanedUp = true;
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
            }
            this.imageBlobUrl.set(undefined);
          });
        }
      } else {
        this.imageBlobUrl.set(undefined);
      }
    });

    effect(() => {
      const mapElement = this.mapElementRef();

      if (!mapElement) {
        this.destroyMap();
        return;
      }

      this.ensureMap(mapElement.nativeElement);

      const currentTour = this.tour();

      if (!currentTour) {
        return;
      }

      this.renderTourOnMap(currentTour);
    });

    this.destroyRef.onDestroy(() => {
      this.destroyMap();
    });
  }

  requestEdit(): void {
    const currentTour = this.tour();

    if (!currentTour) {
      return;
    }

    this.editRequested.emit(currentTour);
  }

  requestDelete(): void {
    const currentTour = this.tour();

    if (!currentTour) {
      return;
    }

    this.deleteRequested.emit(currentTour);
  }

  requestAddLog(): void {
    this.addLogRequested.emit();
  }

  requestEditLog(log: TourLog): void {
    this.logEditRequested.emit(log);
  }

  requestDeleteLog(log: TourLog): void {
    this.logDeleteRequested.emit(log);
  }

  onWindowResize(): void {
    this.map?.invalidateSize();
  }

  private ensureMap(container: HTMLDivElement): void {
    if (this.map) {
      return;
    }

    this.map = L.map(container, {
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.routeLayer = L.layerGroup().addTo(this.map);
    this.map.setView(this.defaultCenter, 10);
    this.map.invalidateSize();
  }

  private destroyMap(): void {
    this.map?.remove();
    this.map = undefined;
    this.routeLayer = undefined;
    this.mapError.set(undefined);
  }

  // Draw the route on the map using the backend-provided routeGeometry (ORS coordinates).
  private renderTourOnMap(tour: Tour): void {
    if (!this.map || !this.routeLayer) {
      return;
    }

    this.routeLayer.clearLayers();
    this.mapError.set(undefined);

    if (!tour.routeGeometry) {
      this.map.setView(this.defaultCenter, 10);
      this.mapError.set('Route data not available.');
      this.map.invalidateSize();
      return;
    }

    let latLngs: L.LatLngTuple[];

    try {
      // Backend stores geometry as [[lon,lat],...]; Leaflet needs [lat,lon].
      const coords = JSON.parse(tour.routeGeometry) as [number, number][];
      latLngs = coords.map(([lon, lat]) => [lat, lon] as L.LatLngTuple);
    } catch {
      this.map.setView(this.defaultCenter, 10);
      this.mapError.set('Route data could not be loaded.');
      this.map.invalidateSize();
      return;
    }

    if (latLngs.length === 0) {
      this.map.setView(this.defaultCenter, 10);
      this.mapError.set('Route data is empty.');
      this.map.invalidateSize();
      return;
    }

    L.polyline(latLngs, { color: '#1d4ed8', weight: 4 }).addTo(this.routeLayer);

    const startPoint = latLngs[0];
    const endPoint = latLngs[latLngs.length - 1];

    L.circleMarker(startPoint, { color: '#15803d', fillColor: '#15803d', fillOpacity: 1, radius: 6 })
      .addTo(this.routeLayer)
      .bindPopup(`From: ${tour.from}`);

    L.circleMarker(endPoint, { color: '#b91c1c', fillColor: '#b91c1c', fillOpacity: 1, radius: 6 })
      .addTo(this.routeLayer)
      .bindPopup(`To: ${tour.to}`);

    this.map.fitBounds(L.latLngBounds(latLngs), { padding: [30, 30] });
    this.map.invalidateSize();
  }
}

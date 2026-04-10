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
import * as L from 'leaflet';
import { Tour } from '../../models/tour.model';
import { TourLog } from '../../models/tour-log.model';
import { TourLogList } from '../tour-log-list/tour-log-list';
import { AttributeField } from '../shared/attribute-field/attribute-field';

interface NominatimResult {
  lat: string;
  lon: string;
}

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

  private map: L.Map | undefined;
  private readonly defaultCenter: L.LatLngTuple = [48.2082, 16.3738];
  private routeLayer: L.LayerGroup | undefined;
  private geocodeRequestId = 0;
  private readonly coordinateCache = new Map<string, L.LatLngTuple>();

  readonly tour = input<Tour | undefined>();
  readonly logs = input<TourLog[]>([]);
  readonly addLogRequested = output<void>();
  readonly editRequested = output<Tour>();
  readonly deleteRequested = output<Tour>();
  readonly mapError = signal<string | undefined>(undefined);
  readonly imagePath = computed(() => {
    const imageFilePath = this.tour()?.imageFilePath?.trim();

    if (!imageFilePath) {
      return undefined;
    }

    // absolute path or full URL
    if (
      imageFilePath.startsWith('/') ||
      imageFilePath.startsWith('http') ||
      imageFilePath.startsWith('blob:') ||
      imageFilePath.startsWith('data:')
    ) {
      return imageFilePath;
    }

    // Relative path
    return `/${imageFilePath}`;
  });
  readonly imageAlt = computed(() => `Tour image for ${this.tour()?.name ?? 'selected tour'}`);

  constructor() {
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

      void this.renderTourOnMap(currentTour);
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

  private async renderTourOnMap(tour: Tour): Promise<void> {
    const currentRequestId = ++this.geocodeRequestId;

    if (!this.map || !this.routeLayer) {
      return;
    }

    this.routeLayer.clearLayers();
    this.mapError.set(undefined);

    const fromCoordinate = await this.resolveCoordinate(tour.from);

    if (currentRequestId !== this.geocodeRequestId || !this.map || !this.routeLayer) {
      return;
    }

    const toCoordinate = await this.resolveCoordinate(tour.to);

    if (currentRequestId !== this.geocodeRequestId || !this.map || !this.routeLayer) {
      return;
    }

    if (fromCoordinate && toCoordinate) {
      L.polyline([fromCoordinate, toCoordinate], {
        color: '#1d4ed8',
        weight: 4,
      }).addTo(this.routeLayer);

      L.circleMarker(fromCoordinate, {
        color: '#15803d',
        fillColor: '#15803d',
        fillOpacity: 1,
        radius: 6,
      })
        .addTo(this.routeLayer)
        .bindPopup(`From: ${tour.from}`);

      L.circleMarker(toCoordinate, {
        color: '#b91c1c',
        fillColor: '#b91c1c',
        fillOpacity: 1,
        radius: 6,
      })
        .addTo(this.routeLayer)
        .bindPopup(`To: ${tour.to}`);

      this.map.fitBounds(L.latLngBounds([fromCoordinate, toCoordinate]), {
        padding: [30, 30],
      });
      this.map.invalidateSize();
      return;
    }

    const fallbackCoordinate = fromCoordinate ?? toCoordinate;

    if (fallbackCoordinate) {
      L.circleMarker(fallbackCoordinate, {
        color: '#1d4ed8',
        fillColor: '#1d4ed8',
        fillOpacity: 1,
        radius: 6,
      })
        .addTo(this.routeLayer)
        .bindPopup(fromCoordinate ? `From: ${tour.from}` : `To: ${tour.to}`);

      this.map.setView(fallbackCoordinate, 12);
      this.mapError.set('Only one location could be resolved on the map.');
      this.map.invalidateSize();
      return;
    }

    this.map.setView(this.defaultCenter, 10);
    this.mapError.set('The selected locations could not be resolved on the map.');
    this.map.invalidateSize();
  }

  private async resolveCoordinate(locationText: string): Promise<L.LatLngTuple | undefined> {
    const normalizedLocation = locationText.trim().toLowerCase();

    if (!normalizedLocation) {
      return undefined;
    }

    const cachedCoordinate = this.coordinateCache.get(normalizedLocation);

    if (cachedCoordinate) {
      return cachedCoordinate;
    }

    try {
      const query = encodeURIComponent(locationText.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`
      );

      if (!response.ok) {
        return undefined;
      }

      const results = (await response.json()) as NominatimResult[];
      const firstResult = results[0];

      if (!firstResult) {
        return undefined;
      }

      const latitude = Number.parseFloat(firstResult.lat);
      const longitude = Number.parseFloat(firstResult.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return undefined;
      }

      const coordinate: L.LatLngTuple = [latitude, longitude];
      this.coordinateCache.set(normalizedLocation, coordinate);
      return coordinate;
    } catch {
      return undefined;
    }
  }
}

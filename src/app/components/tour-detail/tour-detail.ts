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

  // Parsed elevation profile: array of {distKm, elevM} for SVG chart
  readonly elevationPoints = computed(() => {
    const profile = this.tour()?.elevationProfile;
    if (!profile) return [];
    try {
      const coords = JSON.parse(profile) as [number, number, number][];
      if (coords.length < 2) return [];
      const points: { distKm: number; elevM: number }[] = [{ distKm: 0, elevM: coords[0][2] ?? 0 }];
      let cumDist = 0;
      for (let i = 1; i < coords.length; i++) {
        cumDist += haversineKm(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
        points.push({ distKm: cumDist, elevM: coords[i][2] ?? 0 });
      }
      return points;
    } catch {
      return [];
    }
  });

  readonly ascentLabel = computed(() => {
    const v = this.tour()?.ascentM;
    return v != null ? `+${Math.round(v)} m` : null;
  });

  readonly descentLabel = computed(() => {
    const v = this.tour()?.descentM;
    return v != null ? `-${Math.round(v)} m` : null;
  });

  // SVG chart data derived from elevationPoints: path string and axis metadata
  readonly elevationSvgData = computed(() => {
    const pts = this.elevationPoints();
    if (pts.length < 2) return null;

    const W = 1000; // SVG viewBox width
    const H = 230;  // SVG viewBox height
    const padLeft = 64;  // Space for Y labels
    const padBottom = 56; // Space for X labels and unit title
    const padTop = 16;
    const padRight = 24; // Padding to prevent right label clipping
    const drawW = W - padLeft - padRight;
    const drawH = H - padBottom - padTop;

    const actualMin = Math.min(...pts.map(p => p.elevM));
    const actualMax = Math.max(...pts.map(p => p.elevM));
    
    // Minimum span of 100m to avoid extreme scaling on flat routes
    const span = Math.max(actualMax - actualMin, 100);
    const mid = (actualMax + actualMin) / 2;
    let minElev = mid - span / 2;
    let maxElev = mid + span / 2;

    // Round bounds to clean intervals (50m or 100m)
    const rounding = span > 500 ? 100 : 50;
    minElev = Math.floor(minElev / rounding) * rounding;
    maxElev = Math.ceil(maxElev / rounding) * rounding;

    const elevRange = (maxElev - minElev) || 100;
    const totalDist = pts[pts.length - 1].distKm || 1.0;

    // Map a point to SVG coordinates
    const toX = (distKm: number) => padLeft + (distKm / totalDist) * drawW;
    const toY = (elevM: number) => padTop + drawH - ((elevM - minElev) / elevRange) * drawH;

    // Build line path (instead of polyline points string)
    const linePath = 'M ' + pts.map(p => `${toX(p.distKm).toFixed(1)},${toY(p.elevM).toFixed(1)}`).join(' L ');

    // Build filled area path (polyline + close to baseline)
    const first = pts[0];
    const last = pts[pts.length - 1];
    const baseY = (padTop + drawH).toFixed(1);
    const areaPath = `M ${toX(first.distKm).toFixed(1)},${baseY} ` +
      pts.map(p => `L ${toX(p.distKm).toFixed(1)},${toY(p.elevM).toFixed(1)}`).join(' ') +
      ` L ${toX(last.distKm).toFixed(1)},${baseY} Z`;

    // Y-axis labels: min, mid, max elevation
    const midElev = Math.round((minElev + maxElev) / 2);
    const yLabels = [
      { label: `${maxElev} m`, y: toY(maxElev) },
      { label: `${midElev} m`, y: toY(midElev) },
      { label: `${minElev} m`, y: toY(minElev) },
    ];

    // X-axis labels: evenly spaced km markers
    const xLabelCount = Math.min(6, Math.max(2, Math.ceil(totalDist)));
    const xStep = totalDist / xLabelCount;
    const xLabels: { label: string; x: number }[] = [];
    for (let i = 0; i <= xLabelCount; i++) {
      const d = i * xStep;
      xLabels.push({ 
        label: d.toFixed(1), 
        x: toX(Math.min(d, totalDist))
      });
    }

    return { linePath, areaPath, yLabels, xLabels, baselineY: baseY, padLeft, padTop, drawW, drawH, viewBox: `0 0 ${W} ${H}` };
  });


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

// Haversine formula: returns distance in km between two lat/lon points
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

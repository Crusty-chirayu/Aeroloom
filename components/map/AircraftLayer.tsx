'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import type { AircraftPosition, PositionSample } from '@/lib/providers/positions/types';
import { aircraftToGeoJson } from '@/lib/map/aircraftGeoJson';
import { trailToGeoJson } from '@/lib/map/trailGeoJson';
import { registerAircraftIcons, ICON_IDS } from '@/lib/map/aircraftIcon';
import type { FlightCategoryFilter } from '@/lib/map/aircraftGeoJson';

const SOURCE_ID = 'aircraft-source';
const LAYER_UNSELECTED_ID = 'aircraft-layer';
const LAYER_SELECTED_ID = 'aircraft-selected-layer';

const TRAIL_SOURCE_ID = 'aircraft-trail-source';
const TRAIL_LAYER_ID = 'aircraft-trail-layer';
const TRAIL_GLOW_LAYER_ID = 'aircraft-trail-glow-layer';

interface AircraftLayerProps {
  map: MapLibreMap | null;
  aircraft: AircraftPosition[];
  selectedAircraftId: string | null;
  selectedAircraftTrail?: PositionSample[];
  searchQuery?: string;
  activeFilter?: FlightCategoryFilter;
  onSelectAircraft: (id: string | null) => void;
  isFollowMode?: boolean;
  onDisableFollowMode?: () => void;
}

export default function AircraftLayer({
  map,
  aircraft,
  selectedAircraftId,
  selectedAircraftTrail,
  searchQuery = '',
  activeFilter = 'ALL',
  onSelectAircraft,
  isFollowMode = false,
  onDisableFollowMode,
}: AircraftLayerProps) {
  const isLayersAddedRef = useRef<boolean>(false);
  const selectedAircraftRef = useRef<AircraftPosition | null>(null);

  // Keep ref of selected aircraft for follow-mode
  const selectedAircraft = aircraft.find((a) => a.id === selectedAircraftId) || null;
  selectedAircraftRef.current = selectedAircraft;

  // Add / remove layers when map is ready or style reloads
  useEffect(() => {
    if (!map) return;

    const setupLayers = () => {
      // Register custom canvas icons into WebGL sprite atlas
      registerAircraftIcons(map);

      // 1. Trail Source and Layers (mounted underneath aircraft symbols)
      let trailSource = map.getSource(TRAIL_SOURCE_ID) as GeoJSONSource | undefined;
      const initialTrail = trailToGeoJson(selectedAircraftTrail);
      if (!trailSource) {
        map.addSource(TRAIL_SOURCE_ID, {
          type: 'geojson',
          data: initialTrail,
        });
      }

      if (!map.getLayer(TRAIL_GLOW_LAYER_ID)) {
        map.addLayer({
          id: TRAIL_GLOW_LAYER_ID,
          type: 'line',
          source: TRAIL_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#0284c7',
            'line-width': 6,
            'line-opacity': 0.35,
            'line-blur': 3,
          },
        });
      }

      if (!map.getLayer(TRAIL_LAYER_ID)) {
        map.addLayer({
          id: TRAIL_LAYER_ID,
          type: 'line',
          source: TRAIL_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#38bdf8',
            'line-width': 2.5,
            'line-opacity': 0.85,
            'line-dasharray': [2, 1],
          },
        });
      }

      // 2. Aircraft Marker Source and Layers
      let source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      const initialData = aircraftToGeoJson(aircraft, selectedAircraftId, searchQuery);

      if (!source) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: initialData,
        });
      }

      // Add Unselected Aircraft Layer
      if (!map.getLayer(LAYER_UNSELECTED_ID)) {
        map.addLayer({
          id: LAYER_UNSELECTED_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['!=', ['get', 'isSelected'], true],
          layout: {
            'icon-image': [
              'match',
              ['get', 'statusColor'],
              '#10b981',
              ICON_IDS.EMERALD,
              '#f59e0b',
              ICON_IDS.AMBER,
              '#ef4444',
              ICON_IDS.CRIMSON,
              '#818cf8',
              ICON_IDS.VIOLET,
              ICON_IDS.CYAN,
            ],
            'icon-rotate': ['get', 'heading'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4,
              0.45,
              8,
              0.65,
              12,
              0.95,
              16,
              1.25,
            ],
            'text-field': [
              'case',
              ['get', 'shouldShowLabel'],
              [
                'step',
                ['zoom'],
                '',
                8.2,
                ['get', 'callsign'],
                10.5,
                ['concat', ['get', 'callsign'], '\n', ['get', 'telemetryLabel']],
              ],
              [
                'step',
                ['zoom'],
                '',
                10.2,
                ['get', 'callsign'],
                11.8,
                ['concat', ['get', 'callsign'], '\n', ['get', 'telemetryLabel']],
              ],
            ],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 10,
            'text-offset': [0, 1.4],
            'text-anchor': 'top',
            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            'text-optional': true,
            'text-allow-overlap': false,
            'text-padding': 3,
          },
          paint: {
            'text-color': '#94a3b8',
            'text-halo-color': '#080b11',
            'text-halo-width': 2,
          },
        });
      }

      // Add Selected Aircraft Highlight Layer
      if (!map.getLayer(LAYER_SELECTED_ID)) {
        map.addLayer({
          id: LAYER_SELECTED_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['==', ['get', 'isSelected'], true],
          layout: {
            'icon-image': ICON_IDS.SELECTED,
            'icon-rotate': ['get', 'heading'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4,
              0.7,
              8,
              0.95,
              12,
              1.25,
              16,
              1.5,
            ],
            'text-field': ['concat', ['get', 'callsign'], '\n', ['get', 'telemetryLabel']],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-offset': [0, 1.8],
            'text-anchor': 'top',
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#38bdf8',
            'text-halo-color': '#080b11',
            'text-halo-width': 3,
          },
        });
      }

      isLayersAddedRef.current = true;
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once('styledata', setupLayers);
    }

    // Recover custom layers if basemap style is switched dynamically
    const handleStyleReload = () => {
      if (map.isStyleLoaded() && !map.getSource(SOURCE_ID)) {
        setupLayers();
      }
    };
    map.on('styledata', handleStyleReload);

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__aeroloomSelectAircraft = onSelectAircraft;
    }

    // Interactive Click Selection
    const handleAircraftClick = (e: MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_SELECTED_ID, LAYER_UNSELECTED_ID],
      });

      if (features.length > 0) {
        const clickedId = features[0].properties?.id;
        if (clickedId) {
          onSelectAircraft(clickedId);
        }
      }
    };

    // User manual exploration: if user drags/pans the map, disengage camera follow mode
    const handleUserDrag = () => {
      if (isFollowMode) {
        onDisableFollowMode?.();
      }
    };

    // Cursor pointer on hover
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', LAYER_UNSELECTED_ID, handleAircraftClick);
    map.on('click', LAYER_SELECTED_ID, handleAircraftClick);
    map.on('dragstart', handleUserDrag);
    map.on('mouseenter', LAYER_UNSELECTED_ID, handleMouseEnter);
    map.on('mouseleave', LAYER_UNSELECTED_ID, handleMouseLeave);
    map.on('mouseenter', LAYER_SELECTED_ID, handleMouseEnter);
    map.on('mouseleave', LAYER_SELECTED_ID, handleMouseLeave);

    return () => {
      map.off('styledata', handleStyleReload);
      map.off('click', LAYER_UNSELECTED_ID, handleAircraftClick);
      map.off('click', LAYER_SELECTED_ID, handleAircraftClick);
      map.off('dragstart', handleUserDrag);
      map.off('mouseenter', LAYER_UNSELECTED_ID, handleMouseEnter);
      map.off('mouseleave', LAYER_UNSELECTED_ID, handleMouseLeave);
      map.off('mouseenter', LAYER_SELECTED_ID, handleMouseEnter);
      map.off('mouseleave', LAYER_SELECTED_ID, handleMouseLeave);
    };
  }, [map, onSelectAircraft, isFollowMode, onDisableFollowMode]);

  // Update GeoJSON source whenever aircraft positions, selection, filter, or search changes
  useEffect(() => {
    if (!map) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      const geojson = aircraftToGeoJson(aircraft, selectedAircraftId, searchQuery, activeFilter);
      source.setData(geojson);
    }
  }, [map, aircraft, selectedAircraftId, searchQuery, activeFilter]);

  // Update Breadcrumb Trail source whenever selected aircraft trail updates
  useEffect(() => {
    if (!map) return;
    const trailSource = map.getSource(TRAIL_SOURCE_ID) as GeoJSONSource | undefined;
    if (trailSource) {
      const trailData = trailToGeoJson(selectedAircraftTrail);
      trailSource.setData(trailData);
    }
  }, [map, selectedAircraftTrail]);

  // Camera follow-mode: pan to aircraft when enabled and position updates
  useEffect(() => {
    if (!map || !isFollowMode || !selectedAircraft) return;

    map.easeTo({
      center: [selectedAircraft.longitude, selectedAircraft.latitude],
      duration: 1200,
      essential: true,
    });
  }, [map, isFollowMode, selectedAircraft?.latitude, selectedAircraft?.longitude]);

  return null;
}

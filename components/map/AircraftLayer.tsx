'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, GeoJSONSource, MapMouseEvent } from 'maplibre-gl';
import type { AircraftPosition } from '@/lib/providers/positions/types';
import { aircraftToGeoJson } from '@/lib/map/aircraftGeoJson';
import { registerAircraftIcons, ICON_IDS } from '@/lib/map/aircraftIcon';

const SOURCE_ID = 'aircraft-source';
const LAYER_UNSELECTED_ID = 'aircraft-layer';
const LAYER_SELECTED_ID = 'aircraft-selected-layer';

interface AircraftLayerProps {
  map: MapLibreMap | null;
  aircraft: AircraftPosition[];
  selectedAircraftId: string | null;
  searchQuery?: string;
  onSelectAircraft: (id: string | null) => void;
  isFollowMode?: boolean;
}

export default function AircraftLayer({
  map,
  aircraft,
  selectedAircraftId,
  searchQuery = '',
  onSelectAircraft,
  isFollowMode = false,
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

      // Check if source already exists
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
              'step',
              ['zoom'],
              '',
              8,
              ['get', 'callsign'],
              10,
              ['concat', ['get', 'callsign'], '\n', ['get', 'telemetryLabel']],
            ],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 10,
            'text-offset': [0, 1.4],
            'text-anchor': 'top',
            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            'text-optional': true,
            'text-allow-overlap': false,
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

    // Cursor pointer on hover
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', LAYER_UNSELECTED_ID, handleAircraftClick);
    map.on('click', LAYER_SELECTED_ID, handleAircraftClick);
    map.on('mouseenter', LAYER_UNSELECTED_ID, handleMouseEnter);
    map.on('mouseleave', LAYER_UNSELECTED_ID, handleMouseLeave);
    map.on('mouseenter', LAYER_SELECTED_ID, handleMouseEnter);
    map.on('mouseleave', LAYER_SELECTED_ID, handleMouseLeave);

    return () => {
      map.off('click', LAYER_UNSELECTED_ID, handleAircraftClick);
      map.off('click', LAYER_SELECTED_ID, handleAircraftClick);
      map.off('mouseenter', LAYER_UNSELECTED_ID, handleMouseEnter);
      map.off('mouseleave', LAYER_UNSELECTED_ID, handleMouseLeave);
      map.off('mouseenter', LAYER_SELECTED_ID, handleMouseEnter);
      map.off('mouseleave', LAYER_SELECTED_ID, handleMouseLeave);
    };
  }, [map, onSelectAircraft]);

  // Update GeoJSON source whenever aircraft positions, selection, or search changes
  useEffect(() => {
    if (!map) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      const geojson = aircraftToGeoJson(aircraft, selectedAircraftId, searchQuery);
      source.setData(geojson);
    }
  }, [map, aircraft, selectedAircraftId, searchQuery]);

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

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Map, { Source, Layer } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { GeoJSONData, LogLevel, FileVisualizerProps } from "@/types";
import { getLayerStyle } from "@/components/GeoLayerStyle";

export const LoadGeoJSON = ({ file, onLog }: FileVisualizerProps) => {
  const { toast } = useToast();
  const toastAndLog = (message: string, level: LogLevel) => {
    const now = new Date();
    const formattedLogTime = now.toLocaleString("en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    let variant: "default" | "destructive" = "default";
    if (level === LogLevel.ERROR) variant = "destructive";
    else if (level === LogLevel.WARNING) variant = "destructive";
    else if (level === LogLevel.SUCCESS) variant = "default";

    const logMessage = `[${formattedLogTime}] [${level}] ${message}`;

    toast({
      variant,
      title: `[${level}] ${message}`,
      description: formattedLogTime,
    });
    onLog(logMessage);
  };

  const [geoJSONData, setGeoJSONData] = useState<GeoJSONData | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -100,
    latitude: 40,
    zoom: 3.5,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    loadGeoJSON();
  }, [file]);

  const loadGeoJSON = async () => {
    try {
      const text = await file.file.text();
      const data = JSON.parse(text);
      setGeoJSONData(data);

      // Automatically fit the map to the GeoJSON data bounds
      if (data.features && data.features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        data.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.coordinates) {
            if (feature.geometry.type === "Point") {
              bounds.extend(feature.geometry.coordinates);
            } else if (feature.geometry.type === "Polygon") {
              feature.geometry.coordinates[0].forEach(
                (coord: [number, number]) => {
                  bounds.extend(coord);
                }
              );
            } else if (feature.geometry.type === "LineString") {
              feature.geometry.coordinates.forEach(
                (coord: [number, number]) => {
                  bounds.extend(coord);
                }
              );
            }
          }
        });

        if (!bounds.isEmpty()) {
          const { lng: longitude, lat: latitude } = bounds.getCenter();
          setViewState((prev) => ({
            ...prev,
            longitude,
            latitude,
            zoom: 8,
          }));
        }
      }

      const msg = `Successfully loaded GeoJSON: ${file.file.name}`;
      toastAndLog(msg, LogLevel.SUCCESS);
    } catch (error) {
      const msg = `Failed to load GeoJSON: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      toastAndLog(msg, LogLevel.ERROR);
    }
  };

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      initialViewState={{
        latitude: 40,
        longitude: -100,
        zoom: 3,
      }}
      style={{ width: "100%", height: "100%" }}
      // mapStyle="mapbox://styles/mapbox/standard"
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
    >
      {geoJSONData && (
        <Source key={`geojson-source`} type="geojson" data={geoJSONData}>
          {geoJSONData.features.map((feature, index) => (
            <Layer
              key={`layer-${index}`}
              {...getLayerStyle(feature.geometry.type)}
            />
          ))}
        </Source>
      )}
    </Map>
  );
};

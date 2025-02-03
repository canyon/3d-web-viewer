
import { useEffect, useRef, useState } from "react";
import Map, { Source, Layer, LayerProps } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { UploadedFile, FileType } from "@/types";
import * as PCL from "pcl.js";
import PointCloudViewer from "pcl.js/PointCloudViewer";

interface FileVisualizerProps {
  file: UploadedFile;
  onLog: (message: string) => void;
}

interface GeoJSONData {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: any;
    };
    properties?: Record<string, any>;
  }>;
}

const FileVisualizer = ({ file, onLog }: FileVisualizerProps) => {
  const [geoJSONData, setGeoJSONData] = useState<GeoJSONData | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -100,
    latitude: 40,
    zoom: 3.5,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    if (file.type === FileType.POINT_CLOUD) {
      loadPointCloud();
    } else if (file.type === FileType.GIS) {
      loadGeoJSON();
    }
  }, [file]);

  function getPoints(numberOfPoints: number) {
    const points = Array(numberOfPoints);
    for (let i = 0; i < numberOfPoints; i++) {
      const point = Array(3);
      if (i % 6 === 0) {
        point[0] = Math.random() * 13 - 6.5;
        point[1] = Math.random() * 5 - 2.5;
        point[2] = -0.5;
      } else if (i % 6 === 1) {
        point[0] = Math.random() * 13 - 6.5;
        point[1] = 2.5;
        point[2] = Math.random() * 1 - 0.5;
      } else if (i % 6 === 2) {
        point[0] = Math.random() * 13 - 6.5;
        point[1] = Math.random() * 5 - 2.5;
        point[2] = 0.5;
      } else if (i % 6 === 3) {
        point[0] = Math.random() * 13 - 6.5;
        point[1] = -2.5;
        point[2] = Math.random() * 1 - 0.5;
      } else if (i % 6 === 4) {
        point[0] = 6.5;
        point[1] = Math.random() * 5 - 2.5;
        point[2] = Math.random() * 1 - 0.5;
      } else if (i % 6 === 5) {
        point[0] = -6.5;
        point[1] = Math.random() * 5 - 2.5;
        point[2] = Math.random() * 1 - 0.5;
      }
      points[i] = point;
    }
    return points;
  }

  function convertToPCDArrayBuffer(points: number[]) {
    const headerLines = [
      "# .PCD v.7 - Point Cloud Data file format",
      "VERSION .7",
      "FIELDS x y z",
      "SIZE 4 4 4",
      "TYPE F F F",
      "COUNT 1 1 1",
      `WIDTH ${points.length}`,
      "HEIGHT 1",
      "VIEWPOINT 0 0 0 1 0 0 0",
      `POINTS ${points.length}`,
      "DATA ascii",
    ];
    const bodyLines = points.map((point) => point.join(" "));
    const pcdString = headerLines.join("\n") + "\n" + bodyLines.join("\n");
    const encoder = new TextEncoder();
    return encoder.encode(pcdString);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLCanvasElement>(null);
  const PointCloudViewerRef = useRef<PointCloudViewer>(null);
  const loadPointCloud = async () => {
    // try {
      await PCL.init({
        url: `https://cdn.jsdelivr.net/npm/pcl.js/dist/pcl-core.wasm`,
      });
      const arrayBuffer = await file.file.arrayBuffer();
      // const arrayBuffer = convertToPCDArrayBuffer(getPoints(500000));

      const cloud = PCL.loadPCDData(arrayBuffer);

      // Print PCD info
      const fileSizeInBytes = arrayBuffer.byteLength;
      const fileSizeInKB = Math.round(fileSizeInBytes / 1024);
      const fileSizeInMB = fileSizeInBytes / 1024 / 1024;
      const fileSizeInMBDisplay =
        fileSizeInMB < 1 ? "<1" : Math.round(fileSizeInMB);
      const pcdInfo =  `File name: ${file.file.name}, Total Points:${cloud.size}, File Size: ${fileSizeInBytes} bytes (${fileSizeInKB} KB, ${fileSizeInMBDisplay} MB)`
      console.log(pcdInfo);

      PointCloudViewerRef.current = new PointCloudViewer(
        viewerRef.current,
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );

      PointCloudViewerRef.current.addPointCloud(cloud);
      // PointCloudViewerRef.current.setPointCloudProperties({ color: "#F00" });
      PointCloudViewerRef.current.setAxesHelper({ visible: true, size: 1 });
      PointCloudViewerRef.current.setCameraParameters({
        position: { x: 0, y: 0, z: 1.5 },
      });
      window.addEventListener("resize", () => {
        PointCloudViewerRef.current.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      });

      onLog(`Successfully loaded point cloud: ${pcdInfo}`);
    // } catch (error) {
    //   onLog(
    //     `Failed to load point cloud: ${
    //       error instanceof Error ? error.message : "Unknown error"
    //     }`
    //   );
    // }
  };

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

      onLog(`Successfully loaded GeoJSON: ${file.file.name}`);
    } catch (error) {
      onLog(
        `Failed to load GeoJSON: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const getLayerStyle = (geometryType: string): LayerProps => {
    switch (geometryType) {
      case "Point":
        return {
          id: "point-layer",
          type: "circle",
          paint: {
            "circle-radius": 6,
            "circle-color": "#007cbf",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        };
      case "Polygon":
        return {
          id: "polygon-layer",
          type: "fill",
          paint: {
            "fill-color": "#007cbf",
            "fill-opacity": 0.4,
            "fill-outline-color": "#fff",
          },
        };
      case "LineString":
        return {
          id: "line-layer",
          type: "line",
          paint: {
            "line-color": "#007cbf",
            "line-width": 2,
          },
        };
      default:
        return {
          id: "default-layer",
          type: "circle",
          paint: {
            "circle-radius": 6,
            "circle-color": "#007cbf",
          },
        };
    }
  };

  if (file.type === FileType.GIS) {
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
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={viewerRef} className="w-full h-full"></canvas>
    </div>
  );
};

export default FileVisualizer;

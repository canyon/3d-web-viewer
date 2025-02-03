// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import Map, { Source, Layer, LayerProps } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { UploadedFile, FileType } from "@/types";
// import * as PCL from "pcl.js";
// import PointCloudViewer from "pcl.js/PointCloudViewer";
import * as THREE from "three";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";

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
      initThreeJS();
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

  function convertToPCDArrayBuffer(points: number[][]) {
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

  const threeContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const pcdGUI = useRef(new GUI());
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls | null>(null);
  const pcdLoaderRef = useRef(new PCDLoader());
  const animationFrameId = useRef<number | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const [pointSize, setPointSize] = useState(1.0);
  const initDisplay = () => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = undefined;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (threeContainerRef.current) {
      threeContainerRef.current.innerHTML = "";
    }
    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
    }
    window.removeEventListener("resize", handleResize);
  };

  const initThreeJS = () => {
    if (!threeContainerRef.current) return;
    initDisplay();

    const width = threeContainerRef.current.clientWidth;
    const height = threeContainerRef.current.clientHeight;

    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    cameraRef.current.position.z = 5;

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(width, height);
    threeContainerRef.current.appendChild(rendererRef.current.domElement);
    // threeContainerRef.current.appendChild(pcdGUI.current.domElement);

    const axisHelper = new THREE.AxesHelper(100);
    sceneRef.current.add(axisHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;
    controlsRef.current.screenSpacePanning = true;
    // controlsRef.current.minDistance = 0.5;
    // controlsRef.current.maxDistance = 50;
    controlsRef.current.update();

    // if ((pcdGUI.current.__controllers.length = 0)) {
    //   setupGUI();
    // }
    setupGUI();

    window.addEventListener("resize", handleResize);
    animate();
  };

  const handleResize = () => {
    if (
      !rendererRef.current ||
      !cameraRef.current ||
      !threeContainerRef.current
    )
      return;

    const width = threeContainerRef.current.clientWidth;
    const height = threeContainerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  const animate = () => {
    if (!rendererRef.current || !cameraRef.current) return;

    animationFrameId.current = requestAnimationFrame(animate);
    controlsRef.current?.update();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const setupGUI = () => {
    if ((pcdGUI.current.__controllers.length < 2)) {
      pcdGUI.current
        .add({ pointSize: 1.0 }, "pointSize", 0.1, 5)
        .onChange((value: number) => {
          if (pointCloudRef.current) {
            (pointCloudRef.current.material as THREE.PointsMaterial).size =
              value;
          }
          setPointSize(value);
        });
    }
  };

  const getColorFromHeight = (normalizedZ: number): THREE.Color => {
    const color = new THREE.Color();
    color.setHSL((1.0 - normalizedZ) * 0.6, 1.0, 0.5);
    return color;
  };

  const loadPointCloud = async () => {
    try {
      const arrayBuffer = await file.file.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        onLog("Invalid PCD file: Empty or corrupted data.");
        return;
      }

      pcdLoaderRef.current.load(
        URL.createObjectURL(new Blob([arrayBuffer])),
        (points) => {
          if (pointCloudRef.current) {
            sceneRef.current.remove(pointCloudRef.current);
          }
          pointCloudRef.current = points;

          const allPositions = pointCloudRef.current.geometry.attributes.position
            .array as Float32Array;
          const positions = allPositions.filter((v) => !isNaN(v));

          const boundingBox = new THREE.Box3();
          const center = new THREE.Vector3();
          boundingBox.setFromBufferAttribute(
            new THREE.BufferAttribute(positions, 3)
          );
          boundingBox.getCenter(center);
          const size = new THREE.Vector3();
          boundingBox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.set(
              center.x,
              center.y,
              center.z + maxDim * 2
            );
            cameraRef.current.lookAt(center);
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          }

          const colors = new Float32Array(positions.length);
          let minZ = Infinity;
          let maxZ = -Infinity;
          for (let i = 2; i < positions.length; i += 3) {
            const z = positions[i];
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
          }

          const rangeZ = maxZ - minZ;
          for (let i = 0; i < positions.length; i += 3) {
            const z = positions[i + 2];
            const normalizedZ = rangeZ === 0 ? 0 : (z - minZ) / (maxZ - minZ);
            const color = getColorFromHeight(normalizedZ);

            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
          }

          pointCloudRef.current.geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3)
          );
          sceneRef.current.add(pointCloudRef.current);

          // Print PCD info
          const fileSizeInBytes = arrayBuffer.byteLength;
          const fileSizeInKB = Math.round(fileSizeInBytes / 1024);
          const fileSizeInMB = fileSizeInBytes / 1024 / 1024;
          const fileSizeInMBDisplay =
            fileSizeInMB < 1 ? "<1" : Math.round(fileSizeInMB);
          const pcdInfo = `File name: ${file.file.name}, Total Points:${points.geometry.attributes.position.count}, File Size: ${fileSizeInBytes} bytes (${fileSizeInKB} KB, ${fileSizeInMBDisplay} MB)`;
          onLog(`Successfully loaded point cloud: ${pcdInfo}`);
        },
        (progress) => {
          const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
          onLog(`Loading progress: ${percent}%`);
        },
        (error: any) => {
          onLog(`Error loading point cloud: ${error.message}`);
        }
      );
    } catch (error) {
      onLog(
        `Failed to load point cloud: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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
    // <div ref={containerRef} className="w-full h-full">
    //   <canvas ref={viewerRef} className="w-full h-full"></canvas>
    // </div>
    <div ref={threeContainerRef} className="w-full h-full" />
  );
};

export default FileVisualizer;

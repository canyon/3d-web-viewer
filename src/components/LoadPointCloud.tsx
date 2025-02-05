import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { LogLevel, FileVisualizerProps, PCDFormat } from "@/types";
import { getByteKBMBMsg } from "@/lib/utils";

import * as THREE from "three";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";
import { XYZLoader } from "three/examples/jsm/loaders/XYZLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

export const LoadPointCloud = ({ file, onLog }: FileVisualizerProps) => {
  const POINT_SIZE_MAX = 0.01;
  const POINT_SIZE_MIN = 0.00001;
  const POINT_DEFAULT_SIZE = 0.001;

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

  useEffect(() => {
    initThreeJS();
    loadPointCloud();
  }, [file]);

  const threeContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const pcdGUI = useRef<GUI | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls | null>(null);
  const pcdLoaderRef = useRef(new PCDLoader());
  const xyzLoaderRef = useRef(new XYZLoader());
  const plyLoaderRef = useRef(new PLYLoader());
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const boundingBoxRef = useRef<THREE.BoxHelper>();
  // const axesRef = useRef<THREE.AxesHelper>();

  const initDisplay = () => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = undefined;
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
      30,
      width / height,
      0.0001,
      1000
    );
    cameraRef.current.position.z = 5;
    sceneRef.current.add(cameraRef.current);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(width, height);
    threeContainerRef.current.appendChild(rendererRef.current.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    controlsRef.current.screenSpacePanning = true;
    controlsRef.current.addEventListener("change", animate);
    threeContainerRef.current.addEventListener("resize", handleResize);
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
    animate();
  };

  const animate = () => {
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
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const getColorFromHeight = (normalizedZ: number): THREE.Color => {
    const color = new THREE.Color();
    color.setHSL((1.0 - normalizedZ) * 0.6, 1.0, 0.5);
    return color;
  };

  const createGUI = () => {
    if (!pointCloudRef.current || !threeContainerRef.current) return;

    if (pcdGUI.current) {
      pcdGUI.current.destroy();
    } else {
      pcdGUI.current = new GUI();
    }
    const pointFolder = pcdGUI.current.addFolder("Point Settings");
    const settings = {
      size:
        (pointCloudRef.current.material as THREE.PointsMaterial).size >
        POINT_SIZE_MAX
          ? POINT_SIZE_MAX
          : POINT_DEFAULT_SIZE,
    };
    pointFolder
      .add(settings, "size", POINT_SIZE_MIN, POINT_SIZE_MAX)
      .name("Size")
      .onChange((value) => {
        if (pointCloudRef.current) {
          (pointCloudRef.current.material as THREE.PointsMaterial).size = value;
          animate();
        }
      });
    const materialParams = {
      color: "#ffffff",
    };
    pointFolder
      .addColor(materialParams, "color")
      .name("Color")
      .onChange((value) => {
        if (pointCloudRef.current) {
          (pointCloudRef.current.material as THREE.PointsMaterial).color.setHex(
            parseInt(value.replace("#", "0x"))
          );
          animate();
        }
      });
    pointFolder.open();
    threeContainerRef.current.appendChild(pcdGUI.current.domElement);
  };

  const processPoints = (
    points: THREE.Points<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >,
    arrayBufferByteLength: number
  ) => {
    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
    }

    // Track start time for loading
    const startTime = performance.now();
    pointCloudRef.current = points;
    createGUI();

    const allPositions = pointCloudRef.current.geometry.attributes.position
      .array as Float32Array;
    const positions = allPositions.filter((v) => !isNaN(v));

    pointCloudRef.current.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );

    const boundingBox = new THREE.Box3();
    const center = new THREE.Vector3();
    boundingBox.setFromBufferAttribute(new THREE.BufferAttribute(positions, 3));
    boundingBox.getCenter(center);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(center.x, center.y, center.z + maxDim * 2);
      cameraRef.current.lookAt(center);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }

    if (boundingBoxRef.current) {
      sceneRef.current.remove(boundingBoxRef.current);
    }
    boundingBoxRef.current = new THREE.BoxHelper(
      pointCloudRef.current,
      0xff0000
    );
    sceneRef.current.add(boundingBoxRef.current);

    const boundingBoxInfo = `Bounding Box Dimensions: X=${size.x.toFixed(
      2
    )}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}`;

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

    animate();

    // Print PCD info
    const endTime = performance.now();
    const loadDuration = ((endTime - startTime) / 1000).toFixed(2);

    const pcdInfo = `File name: ${file.file.name}, Total Points: ${
      pointCloudRef.current.geometry.attributes.position.count
    }, ${getByteKBMBMsg(
      arrayBufferByteLength
    )}, Load Time: ${loadDuration} seconds, ${boundingBoxInfo}`;
    const msg = `Successfully loaded point cloud: ${pcdInfo}`;
    toastAndLog(msg, LogLevel.SUCCESS);
  };

  const loadPointCloud = async () => {
    // try {
    const arrayBuffer = await file.file.arrayBuffer();
    const arrayBufferByteLength = arrayBuffer.byteLength;
    const url = URL.createObjectURL(new Blob([arrayBuffer]));

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      const msg = "Invalid PCD file: Empty or corrupted data.";
      toastAndLog(msg, LogLevel.ERROR);
      return;
    }

    const fileExtension = file.file.name.split(".").pop()?.toLowerCase();
    switch (fileExtension) {
      case PCDFormat.TXT:
      case PCDFormat.PCD:
        pcdLoaderRef.current.load(
          url,
          (points) => {
            processPoints(points, arrayBufferByteLength);
          },
          (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(
              2
            );
            const msg = `Loading progress: ${percent}%`;
            toastAndLog(msg, LogLevel.INFO);
          },
          (error: any) => {
            const msg = `Error loading point cloud: ${error.message}`;
            toastAndLog(msg, LogLevel.ERROR);
          }
        );
        break;

      case PCDFormat.XYZ:
        xyzLoaderRef.current.load(
          url,
          (geometry) => {
            geometry.center();
            const vertexColors = geometry.hasAttribute("color") === true;
            const material = new THREE.PointsMaterial({
              size: POINT_DEFAULT_SIZE,
              vertexColors: vertexColors,
            });
            processPoints(
              new THREE.Points(geometry, material),
              arrayBufferByteLength
            );
          },
          (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(
              2
            );
            const msg = `Loading progress: ${percent}%`;
            toastAndLog(msg, LogLevel.INFO);
          },
          (error: any) => {
            const msg = `Error loading point cloud: ${error.message}`;
            toastAndLog(msg, LogLevel.ERROR);
          }
        );
        break;

      case PCDFormat.PLY:
        plyLoaderRef.current.load(
          url,
          (geometry) => {
            geometry.computeVertexNormals();
            const vertexColors = geometry.hasAttribute("color") === true;
            const material = new THREE.PointsMaterial({
              size: POINT_DEFAULT_SIZE,
              vertexColors: vertexColors,
            });
            processPoints(
              new THREE.Points(geometry, material),
              arrayBufferByteLength
            );
          },
          (progress) => {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(
              2
            );
            const msg = `Loading progress: ${percent}%`;
            toastAndLog(msg, LogLevel.INFO);
          },
          (error: any) => {
            const msg = `Error loading point cloud: ${error.message}`;
            toastAndLog(msg, LogLevel.ERROR);
          }
        );
        break;
      default:
        break;
    }

    window.addEventListener("resize", handleResize);
    animate();
    // } catch (error) {
    //   const msg = `Failed to load point cloud: ${
    //     error instanceof Error ? error.message : "Unknown error"
    //   }`;
    //   toastAndLog(msg, LogLevel.ERROR);
    // }
  };

  return <div ref={threeContainerRef} className="w-full h-full" />;
};

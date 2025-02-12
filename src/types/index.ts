export interface FileMeta {
  points?: number;
  size?: number;
  bbox?: string;
  features?: number;
}

export interface UploadedFile {
  id: string;
  file: File;
  type: FileType;
  meta: FileMeta;
  layers: any[];
  file_bytes: number;
}

export enum FileType {
  POINT_CLOUD = "point-cloud",
  GIS = "gis",
  UNKNOWN = "unknown",
}

export interface ViewerState {
  activeFileId?: string;
  files: UploadedFile[];
  logs: string[];
}

export interface FileVisualizerProps {
  file: UploadedFile;
  onLog: (message: string) => void;
}

export interface GeoFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: Array<number>;
  };
  properties: Record<string, any>;
}

export interface GeoJSONData {
  type: string;
  features: Array<GeoFeature>;
}

export enum LogLevel {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export enum PCDFormat {
  TXT = "txt",
  PCD = "pcd",
  XYZ = "xyz",
  PLY = "ply",
}

export interface SwitchPageProps {
  onNavigate: () => void;
}
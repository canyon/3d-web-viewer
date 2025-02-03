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
import { FileType, FileVisualizerProps } from "@/types";
import { LoadPointCloud } from "@/components/LoadPointCloud";
import { LoadGeoJSON } from "@/components/LoadGeoJSON";
import { ReadmeCard } from "@/components/ReadmeCard";

const FileVisualizer = ({ file, onLog }: FileVisualizerProps) => {
  switch (file.type) {
    case FileType.POINT_CLOUD:
      return <LoadPointCloud file={file} onLog={onLog} />;

    case FileType.GIS:
      return <LoadGeoJSON file={file} onLog={onLog} />;

    default:
      return <ReadmeCard />;
  }
};

export default FileVisualizer;

import { X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useDropzone } from "react-dropzone";
import { useState, useCallback } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import FileVisualizer from "@/components/FileVisualizer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ThemeProvider } from "@/components/theme-provider";

import { UploadedFile, FileType, FileMeta } from "@/types";

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>();

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, message]);
  }, []);

  const getFileType = (fileName: string): FileType => {
    if (/\.(pcd|xyz)$/i.test(fileName)) return FileType.POINT_CLOUD;
    if (/\.(geojson|json)$/i.test(fileName)) return FileType.GIS;
    return FileType.UNKNOWN;
  };

  const parseFileMetadata = async (
    file: File,
    fileType: FileType
  ): Promise<FileMeta> => {
    const meta: FileMeta = { size: file.size };

    if (fileType === FileType.POINT_CLOUD) {
      meta.points = 0;
    } else if (fileType === FileType.GIS) {
      try {
        const text = await file.text();
        const geojson = JSON.parse(text);
        meta.features = geojson.features?.length || 0;
      } catch (error) {
        addLog(
          `Error parsing GIS file metadata: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return meta;
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/json": [".geojson", ".json"],
      "text/plain": [".xyz", ".pcd"],
    },
    onDrop: async (acceptedFiles) => {
      const newFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          const fileType = getFileType(file.name);
          const meta = await parseFileMetadata(file, fileType);
          return {
            id: uuidv4(),
            file,
            type: fileType,
            meta,
            layers: [],
          };
        })
      );

      setFiles((prev) => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
        addLog(
          `Uploaded file: ${newFiles.map((f) => f.file.name).join(", ")}`
        );
      }
    },
  });

  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="h-screen w-screen overflow-hidden bg-background">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - File List */}
          <ResizablePanel defaultSize={20} minSize={0} maxSize={30}>
            <div className="h-full flex flex-col p-4">
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 mb-4 cursor-pointer hover:border-muted-foreground/50 transition-colors"
              >
                <input {...getInputProps()} />
                <p className="text-center text-muted-foreground">
                  Drop files here or click to upload
                </p>
              </div>
              <h2 className="text-lg font-semibold mb-4">Files</h2>
              <ScrollArea className="flex-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`p-2 mb-1 rounded cursor-pointer hover:bg-accent ${
                      activeFileId === file.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{file.file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles((prev) =>
                            prev.filter((f) => f.id !== file.id)
                          );
                          if (activeFileId === file.id) {
                            setActiveFileId(undefined);
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Visualization */}
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col">
              <Tabs value={activeFileId} className="w-full">
                <ScrollArea className="w-full border-b">
                  <TabsList className="inline-flex h-10 items-center justify-start px-4 w-full">
                    {files.map((file) => (
                      <TabsTrigger
                        key={file.id}
                        value={file.id}
                        onClick={() => setActiveFileId(file.id)}
                        className="relative"
                      >
                        {file.file.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </Tabs>
              <div className="w-full flex-1 relative">
                {activeFile && (
                  <FileVisualizer file={activeFile} onLog={addLog} />
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Logs */}
          <ResizablePanel defaultSize={15} minSize={15} maxSize={30}>
            <div className=" w-full flex p-2">
              <ModeToggle />
            </div>
            <div className="h-full flex flex-col p-4">
              <h2 className="text-lg font-semibold mb-4">Logs</h2>
              <ScrollArea className="flex-1">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="text-sm py-1 border-b border-border"
                  >
                    {log}
                  </div>
                ))}
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ThemeProvider>
  );
}

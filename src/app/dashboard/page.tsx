import { v4 as uuidv4 } from "uuid";
import { useDropzone } from "react-dropzone";
import { useState, useCallback } from "react";

import { X, Github, File, CloudUpload } from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import FileVisualizer from "@/components/FileVisualizer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ThemeProvider } from "@/components/theme-provider";
import LogViewer from "@/components/LogViewer";
import { useToast } from "@/hooks/use-toast";
import { ReadmeCard } from "@/components/ReadmeCard";

import { UploadedFile, FileType, FileMeta, LogLevel } from "@/types";
import { getByteKBMBMsg } from "@/lib/utils";

import {
  Sidebar,
  SidebarGroup,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarMenuAction,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export default function Page() {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>();

  const formattedLogMsg = (message: string, level: LogLevel) => {
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

    return logMessage;
  };

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, message]);
  }, []);

  const getFileType = (fileName: string): FileType => {
    if (/\.(pcd|xyz|txt|ply)$/i.test(fileName)) return FileType.POINT_CLOUD;
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
      "text/plain": [".xyz", ".pcd", ".txt", ".ply"],
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
            file_bytes: file.size,
          };
        })
      );

      setFiles((prev) => [...prev, ...newFiles]);
      if (newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
        const msg = `Uploaded file: ${newFiles
          .map((f) => [f.file.name, getByteKBMBMsg(f.file_bytes)])
          .join(", ")}`;
        addLog(formattedLogMsg(msg, LogLevel.SUCCESS));
      }
    },
  });

  const activeFile = files.find((f) => f.id === activeFileId);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <SidebarProvider>
        <Sidebar collapsible="icon" className="z-[1]">
          <SidebarHeader>
            <SidebarMenuButton className="h-12 mb-1">
              <SidebarTrigger />
              <ModeToggle />
              <Button asChild>
                <a
                  href="https://github.com/canyon/3d-web-viewer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github />
                  Github
                </a>
              </Button>
            </SidebarMenuButton>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuButton className="h-32">
                  <CloudUpload />
                  <div
                    {...getRootProps()}
                    className="h-full border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  >
                    <input {...getInputProps()} />
                    <p className="mt-10 text-center text-muted-foreground">
                      Drop files here or click to upload
                    </p>
                  </div>
                </SidebarMenuButton>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <h2 className="text-lg font-semibold mb-4">Files</h2>
              <SidebarMenu>
                {files.map((file) => (
                  <SidebarMenuItem
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <SidebarMenuButton
                      className={activeFileId === file.id ? "bg-accent" : ""}
                    >
                      <File />
                      <span className="truncate">{file.file.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction>
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles((prev) =>
                            prev.filter((f) => f.id !== file.id)
                          );
                          if (activeFileId === file.id) {
                            setActiveFileId(undefined);
                          }
                        }}
                      />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={80} minSize={0} maxSize={100}>
              <div className="h-full flex flex-col">
                <div className="w-full  h-screen  flex items-center justify-center ">
                  {activeFile ? (
                    <FileVisualizer file={activeFile} onLog={addLog} />
                  ) : (
                    <ReadmeCard />
                  )}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={20} minSize={0} maxSize={50}>
              <div className="h-full flex flex-col p-4">
                <h2 className="text-lg font-semibold mb-2">
                <SidebarTrigger />Logs</h2>
                <ScrollArea className="flex-1">
                  <LogViewer logs={logs} />
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

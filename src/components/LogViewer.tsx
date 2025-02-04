import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type LogViewerProps = {
  logs: string[];
};

const LogViewer = (logs: LogViewerProps) => {
  return logs.logs.map((log, index) => {
    const logParts = log.match(/\[(.*?)\] \[(.*?)\] (.*)/);

    const [_, timestamp = "Unknown Time", level = "INFO", message = log] =
      logParts ?? [];

    let levelColor: string = "text-gray-500";
    switch (level) {
      case "ERROR":
        levelColor = "text-red-500";
        break;
      case "WARNING":
        levelColor = "text-yellow-500";
        break;
      case "SUCCESS":
        levelColor = "text-green-500";
        break;
      default:
        levelColor = "text-gray-500";
    }

    return (
      <div key={index} className="text-md py-1">
        <Card className="border border-gray-300 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs text-gray-600">
              <span className="font-mono text-gray-400">{timestamp}</span>{" "}
              <span className={`font-bold ${levelColor}`}>[{level}]</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-800">{message}</p>
          </CardContent>
        </Card>
      </div>
    );
  });
};

export default LogViewer;

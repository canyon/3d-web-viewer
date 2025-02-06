import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ReadmeCard = () => {
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold">
          3D Point Cloud and Geo-JSON Visualization 🌍✨
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-center text-gray-600 mb-4">
          This web application allows you to visualize{" "}
          <b>3D point cloud data</b> 🟢 and <b>Geo-JSON files</b> 🗺️. You can
          upload your own files or check out example datasets on GitHub.
        </CardDescription>
        <div className="text-center text-gray-700 mt-2">
          <b>Supported formats:</b>
          <span className="text-blue-600">
            {" "}
            PCD 📌, XYZ 📍, TXT 📄, PLY 🏗️, JSON 🗂️, GeoJSON 🗺️
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          asChild
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
        >
          <a
            href="https://github.com/canyon/3d-web-viewer?tab=readme-ov-file#%EF%B8%8F-sample-data"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="mr-2 h-5 w-5" />
            View Example Files on GitHub
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

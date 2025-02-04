import { LayerProps } from "react-map-gl";

export const getLayerStyle = (geometryType: string): LayerProps => {
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

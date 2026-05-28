import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { useEffect, useState, useRef } from "react";

import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapView() {
  const [path, setPath] = useState([]);
  const watchRef = useRef(null);

  // 🟢 起點線
  const startLine = [
    [22.843293, 120.247413],
    [22.843517, 120.247618],
  ];

  // 🔴 終點線
  const endLine = [
    [22.825971, 120.272488],
    [22.826082, 120.272547],
  ];

  useEffect(() => {
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPath((prev) => [...prev, [lat, lng]]);
      },
      (err) => console.log(err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  return (
    <MapContainer
      center={[22.835, 120.26]}
      zoom={14}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "12px",
      }}
    >
      {/* 🗺 地圖底圖 */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 🟢 起點線 */}
      <Polyline
        positions={startLine}
        pathOptions={{
          color: "lime",
          weight: 6,
        }}
      />

      {/* 🔴 終點線 */}
      <Polyline
        positions={endLine}
        pathOptions={{
          color: "red",
          weight: 6,
        }}
      />

      {/* 🔵 GPS 軌跡 */}
      <Polyline
        positions={path}
        pathOptions={{
          color: "blue",
          weight: 4,
        }}
      />

      {/* 🚗 目前位置 */}
      {path.length > 0 && (
        <Marker position={path[path.length - 1]}>
          <Popup>目前位置</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
import {
  GoogleMap,
  Polyline,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";

import { useEffect, useState, useRef } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 22.835,
  lng: 120.26,
};

export default function MapView() {
  // ⚠️ 把這裡換成你自己的 API KEY
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyB8CZyLxfAmVcyG2XMq5zaxa8p8bHiOi8I",
  });

  const [path, setPath] = useState([]);
  const watchRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        // 🔵 GPS 軌跡累積
        setPath((prev) => [...prev, point]);
      },
      (err) => console.log("GPS error:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(
          watchRef.current
        );
      }
    };
  }, [isLoaded]);

  if (!isLoaded) return <div>Loading Map...</div>;

  // 🟢 起點線（宿舍）
  const startLine = [
    { lat: 22.843293, lng: 120.247413 },
    { lat: 22.843517, lng: 120.247618 },
  ];

  // 🔴 終點線（公司）
  const endLine = [
    { lat: 22.825971, lng: 120.272488 },
    { lat: 22.826082, lng: 120.272547 },
  ];

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
    >
      {/* 🟢 起點線 */}
      <Polyline
        path={startLine}
        options={{
          strokeColor: "#00ff00",
          strokeWeight: 4,
        }}
      />

      {/* 🔴 終點線 */}
      <Polyline
        path={endLine}
        options={{
          strokeColor: "#ff0000",
          strokeWeight: 4,
        }}
      />

      {/* 🔵 GPS 軌跡 */}
      <Polyline
        path={path}
        options={{
          strokeColor: "#0066ff",
          strokeWeight: 4,
        }}
      />

      {/* 起點標記 */}
      <Marker position={startLine[0]} label="S" />

      {/* 終點標記 */}
      <Marker position={endLine[0]} label="F" />

      {/* 最新位置 */}
      {path.length > 0 && (
        <Marker
          position={path[path.length - 1]}
          label="🚗"
        />
      )}
    </GoogleMap>
  );
}
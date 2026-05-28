import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

import L from "leaflet";

// 修正 marker
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


// ======================
// 🧠 工具：距離（公尺）
// ======================
function getDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}


// ======================
// 🧠 平滑（低通濾波）
// ======================
function smooth(prev, curr) {
  if (!prev) return curr;

  const alpha = 0.75; // 越高越穩但延遲
  return [
    prev[0] * alpha + curr[0] * (1 - alpha),
    prev[1] * alpha + curr[1] * (1 - alpha),
  ];
}


// ======================
// 🧠 判斷是否合理 GPS
// ======================
function isValidMove(prev, curr, speed) {
  if (!prev) return true;

  const dist = getDistance(prev, curr);

  // ❌ 瞬移（GPS 飄）
  if (dist > 50) return false;

  // ❌ 幾乎沒移動但 GPS 在跳
  if (dist < 1 && speed < 0.5) return false;

  return true;
}


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
        const raw = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        const speed = pos.coords.speed || 0;

        setPath((prev) => {
          const last = prev[prev.length - 1];

          // 🧠 過濾不合理點
          if (!isValidMove(last, raw, speed)) {
            return prev;
          }

          // 🧠 平滑處理
          const filtered = smooth(last, raw);

          return [...prev, filtered];
        });
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
      {/* 🗺 底圖 */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />

      {/* 🟢 起點線 */}
      <Polyline
        positions={startLine}
        pathOptions={{ color: "lime", weight: 6 }}
      />

      {/* 🔴 終點線 */}
      <Polyline
        positions={endLine}
        pathOptions={{ color: "red", weight: 6 }}
      />

      {/* 🔵 GPS 軌跡（穩定版） */}
      <Polyline
        positions={path}
        pathOptions={{ color: "blue", weight: 5 }}
      />

      {/* 🚗 即時位置 */}
      {path.length > 0 && (
        <Marker position={path[path.length - 1]}>
          <Popup>穩定 GPS 位置</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
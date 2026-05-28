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
// 🧠 工具：點到線距離
// ======================
function pointToLineDistance(p, a, b) {
  const A = p[0] - a[0];
  const B = p[1] - a[1];
  const C = b[0] - a[0];
  const D = b[1] - a[1];

  const dot = A * C + B * D;
  const len = C * C + D * D;

  let t = len !== 0 ? dot / len : -1;

  t = Math.max(0, Math.min(1, t));

  const xx = a[0] + t * C;
  const yy = a[1] + t * D;

  const dx = p[0] - xx;
  const dy = p[1] - yy;

  return Math.sqrt(dx * dx + dy * dy) * 111000; // m
}

export default function MapView() {
  const [path, setPath] = useState([]);

  const [state, setState] = useState("idle"); 
  // idle → ready → running → finished

  const [startTime, setStartTime] = useState(null);
  const [result, setResult] = useState(null);

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
        const point = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        setPath((prev) => [...prev, point]);

        const startDist = pointToLineDistance(
          point,
          startLine[0],
          startLine[1]
        );

        const endDist = pointToLineDistance(
          point,
          endLine[0],
          endLine[1]
        );

        // ======================
        // 🟢 起點邏輯
        // ======================
        if (state === "idle" && startDist < 15) {
          setState("ready");
        }

        if (state === "ready" && startDist > 20) {
          setState("running");
          setStartTime(Date.now());
        }

        // ======================
        // 🔴 終點邏輯
        // ======================
        if (state === "running" && endDist < 15) {
          const time = (Date.now() - startTime) / 1000;
          setResult(time);
          setState("finished");
        }
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
  }, [state, startTime]);

  return (
    <div>
      <div style={{ padding: 10 }}>
        <h2>🏁 CCSPEED v12</h2>

        <p>狀態：{state}</p>

        {startTime && (
          <p>
            ⏱ 計時中：{((Date.now() - startTime) / 1000).toFixed(2)}s
          </p>
        )}

        {result && (
          <h3>🏆 成績：{result.toFixed(2)} 秒</h3>
        )}
      </div>

      <MapContainer
        center={[22.835, 120.26]}
        zoom={14}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={startLine} color="lime" />
        <Polyline positions={endLine} color="red" />
        <Polyline positions={path} color="blue" />

        {path.length > 0 && (
          <Marker position={path[path.length - 1]}>
            <Popup>現在位置</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
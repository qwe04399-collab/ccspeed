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

// marker 修正
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


// ==========================
// 🧠 OSRM 貼道路
// ==========================
async function snapToRoad(lat, lng) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`
    );

    const data = await res.json();

    if (!data.waypoints?.length) {
      return [lat, lng];
    }

    const loc = data.waypoints[0].location;
    return [loc[1], loc[0]];
  } catch {
    return [lat, lng];
  }
}


// ==========================
// 🧠 距離
// ==========================
function dist(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}


// ==========================
// 🏁 主程式
// ==========================
export default function MapView() {
  const [path, setPath] = useState([]);

  const [state, setState] = useState("idle"); 
  // idle → ready → running → finished

  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(Date.now());
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


  // ⏱ 即時計時器
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(t);
  }, []);


  // 🧠 判斷是否靠近線
  function nearLine(p, line) {
    return dist(p, line[0]) < 15;
  }


  useEffect(() => {
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const raw = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];

        // 🟢 貼道路
        const fixed = await snapToRoad(raw[0], raw[1]);

        setPath((prev) => {
          const last = prev[prev.length - 1];

          // 🧠 防瞬移
          if (last && dist(last, fixed) > 80) {
            return prev;
          }

          // ======================
          // 🟢 起點邏輯
          // ======================
          if (state === "idle" && nearLine(fixed, startLine)) {
            setState("ready");
          }

          if (state === "ready" && !nearLine(fixed, startLine)) {
            setState("running");
            setStartTime(Date.now());
          }

          // ======================
          // 🔴 終點邏輯
          // ======================
          if (state === "running" && nearLine(fixed, endLine)) {
            const time = (Date.now() - startTime) / 1000;
            setResult(time);
            setState("finished");
          }

          return [...prev, fixed];
        });
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
      {/* ================= UI ================= */}
      <div style={{ padding: 10 }}>
        <h2>🏁 CCSPEED v15</h2>

        <p>狀態：{state}</p>

        {/* ⏱ 即時計時 */}
        {state === "running" && (
          <h3>
            ⏱ 計時中：{((now - startTime) / 1000).toFixed(2)} s
          </h3>
        )}

        {/* 🏆 成績 */}
        {result && (
          <h2 style={{ color: "gold" }}>
            🏆 成績：{result.toFixed(2)} 秒
          </h2>
        )}
      </div>


      {/* ================= 地圖 ================= */}
      <MapContainer
        center={[22.835, 120.26]}
        zoom={14}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 起點 */}
        <Polyline positions={startLine} color="lime" />

        {/* 終點 */}
        <Polyline positions={endLine} color="red" />

        {/* 軌跡 */}
        <Polyline positions={path} color="blue" />

        {/* 目前位置 */}
        {path.length > 0 && (
          <Marker position={path[path.length - 1]}>
            <Popup>GPS 位置</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// 🔴 起點線：紅線
const startLine = [
  [22.843293, 120.247413],
  [22.843517, 120.247618],
];

// 🟢 終點線：綠線
const endLine = [
  [22.825971, 120.272488],
  [22.826082, 120.272547],
];

const MIN_START_SPEED_KMH = 5;
const MAX_VALID_SPEED_KMH = 180;
const MAX_GPS_ACCURACY_M = 15;

function FollowMarker({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 18, { animate: true });
    }
  }, [position, map]);

  return null;
}

function distanceMeters(a, b) {
  const R = 6371000;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

function pointToLineDistance(p, a, b) {
  const latScale = 111000;
  const lngScale = 111000 * Math.cos((p[0] * Math.PI) / 180);

  const px = p[1] * lngScale;
  const py = p[0] * latScale;

  const ax = a[1] * lngScale;
  const ay = a[0] * latScale;

  const bx = b[1] * lngScale;
  const by = b[0] * latScale;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  let t =
    lenSq === 0
      ? 0
      : ((px - ax) * dx + (py - ay) * dy) / lenSq;

  t = Math.max(0, Math.min(1, t));

  const cx = ax + t * dx;
  const cy = ay + t * dy;

  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}

function crossedLine(prev, curr, line) {
  if (!prev || !curr) return false;

  const [a, b] = line;

  const sign = (p) =>
    (b[1] - a[1]) * (p[0] - a[0]) -
    (b[0] - a[0]) * (p[1] - a[1]);

  return sign(prev) * sign(curr) < 0;
}

function isMovingTowardTarget(prev, curr, targetLine) {
  if (!prev || !curr) return false;

  const targetCenter = [
    (targetLine[0][0] + targetLine[1][0]) / 2,
    (targetLine[0][1] + targetLine[1][1]) / 2,
  ];

  const prevDist = distanceMeters(prev, targetCenter);
  const currDist = distanceMeters(curr, targetCenter);

  return currDist < prevDist;
}

function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(
    2,
    "0"
  )}`;
}

export default function RacePage({ nickname, vehicleType, vehicleModel }) {
  const [status, setStatus] = useState("等待起跑");
  const [timer, setTimer] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [finishTime, setFinishTime] = useState(null);

  const [gpsAccuracy, setGpsAccuracy] = useState(0);
  const [startDist, setStartDist] = useState(0);
  const [endDist, setEndDist] = useState(0);

  const [currentPoint, setCurrentPoint] = useState(null);
  const [path, setPath] = useState([]);
  const [showMap, setShowMap] = useState(true);

  const watchRef = useRef(null);
  const statusRef = useRef("等待起跑");
  const startTimeRef = useRef(null);

  const lastPointRef = useRef(null);
  const lastTimeRef = useRef(null);

  const speedRef = useRef(0);
  const speedListRef = useRef([]);
  const savedRef = useRef(false);

  const setRaceStatus = (nextStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (statusRef.current === "計時中" && startTimeRef.current) {
        setTimer(Date.now() - startTimeRef.current);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  async function saveResult(finalTime, avg) {
  if (savedRef.current) return;
  savedRef.current = true;

  const { error } = await supabase.from("runs").insert([
    {
      direction: "楠西→大埔",
      vehicle_type: vehicleType,
      vehicle_model: vehicleModel,
      elapsed_ms: finalTime,
      avg_speed: avg,
      max_speed: speedRef.current,
      finish_time: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("資料庫寫入失敗", error);
    alert("資料庫寫入失敗：" + error.message);
  } else {
    alert("🏆 成績已儲存");
  }
}

  function resetRace() {
    setRaceStatus("等待起跑");
    setTimer(0);
    setSpeed(0);
    setAvgSpeed(0);
    setFinishTime(null);
    setStartDist(0);
    setEndDist(0);
    setPath([]);

    startTimeRef.current = null;
    lastPointRef.current = null;
    lastTimeRef.current = null;
    speedRef.current = 0;
    speedListRef.current = [];
    savedRef.current = false;
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("此裝置不支援 GPS 定位");
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const point = [pos.coords.latitude, pos.coords.longitude];
        const now = Date.now();

        const accuracy = pos.coords.accuracy || 999;
        setGpsAccuracy(accuracy);
        setCurrentPoint(point);

        const prevPoint = lastPointRef.current;

        if (accuracy > MAX_GPS_ACCURACY_M) {
          lastPointRef.current = point;
          lastTimeRef.current = now;
          return;
        }

        const gpsSpeed =
          pos.coords.speed !== null && pos.coords.speed >= 0
            ? pos.coords.speed * 3.6
            : 0;

        let computedSpeed = 0;

        if (prevPoint && lastTimeRef.current) {
          const dt = (now - lastTimeRef.current) / 1000;
          const meters = distanceMeters(prevPoint, point);

          if (dt > 0) {
            computedSpeed = (meters / dt) * 3.6;
          }
        }

        let finalSpeed = gpsSpeed > 0 ? gpsSpeed : computedSpeed;

        if (finalSpeed > MAX_VALID_SPEED_KMH) {
          finalSpeed = speedRef.current;
        }

        speedRef.current = finalSpeed;
        setSpeed(finalSpeed);

        setPath((prev) => [...prev, point]);

        const sDist = pointToLineDistance(point, startLine[0], startLine[1]);
        const eDist = pointToLineDistance(point, endLine[0], endLine[1]);

        setStartDist(sDist);
        setEndDist(eDist);

        const crossedStart = crossedLine(prevPoint, point, startLine);
        const crossedEnd = crossedLine(prevPoint, point, endLine);
        const towardEnd = isMovingTowardTarget(prevPoint, point, endLine);

        if (
          statusRef.current === "等待起跑" &&
          crossedStart &&
          towardEnd &&
          finalSpeed >= MIN_START_SPEED_KMH
        ) {
          startTimeRef.current = Date.now();
          speedListRef.current = [];
          setTimer(0);
          setRaceStatus("計時中");
        }

        if (
          statusRef.current === "計時中" &&
          finalSpeed > 3 &&
          finalSpeed < MAX_VALID_SPEED_KMH
        ) {
          speedListRef.current.push(finalSpeed);

          const avg =
            speedListRef.current.reduce((a, b) => a + b, 0) /
            speedListRef.current.length;

          setAvgSpeed(avg);
        }

        if (statusRef.current === "計時中" && crossedEnd) {
          const finalTime = Date.now() - startTimeRef.current;

          const avg =
            speedListRef.current.length > 0
              ? speedListRef.current.reduce((a, b) => a + b, 0) /
                speedListRef.current.length
              : 0;

          setFinishTime(finalTime);
          setAvgSpeed(avg);
          setRaceStatus("完賽");

          await saveResult(finalTime, avg);
        }

        lastPointRef.current = point;
        lastTimeRef.current = now;
      },
      (err) => {
        console.error("GPS 錯誤", err);
        alert("GPS 錯誤：" + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000,
      }
    );

    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [nickname, vehicleType, vehicleModel]);

  return (
    <div style={{ textAlign: "center", padding: 16, fontFamily: "Arial" }}>
      <h1>🏁 CCSPEED Line Crossing</h1>

      <h2>{status}</h2>

      <div style={{ fontSize: 46, fontWeight: "bold", margin: "18px 0" }}>
        {formatTime(finishTime ?? timer)}
      </div>

      <h3>🚗 當前速度：{speed.toFixed(0)} km/h</h3>
      <h3>📊 平均速度：{avgSpeed.toFixed(1)} km/h</h3>

      <hr />

      <p>📡 GPS 精度：{gpsAccuracy.toFixed(0)} m</p>
      <p>🔴 起點距離：{startDist.toFixed(1)} m</p>
      <p>🟢 終點距離：{endDist.toFixed(1)} m</p>

      <button onClick={resetRace} style={{ padding: "10px 16px", margin: 6 }}>
        重新開始
      </button>

      <button
        onClick={() => setShowMap(!showMap)}
        style={{ padding: "10px 16px", margin: 6 }}
      >
        {showMap ? "隱藏地圖" : "顯示地圖"}
      </button>

      {showMap && currentPoint && (
        <div style={{ marginTop: 12 }}>
          <MapContainer
            center={currentPoint}
            zoom={18}
            style={{
              height: "420px",
              width: "100%",
              borderRadius: 12,
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FollowMarker position={currentPoint} />

            <Polyline
              positions={startLine}
              pathOptions={{ color: "red", weight: 7 }}
            />

            <Polyline
              positions={endLine}
              pathOptions={{ color: "lime", weight: 7 }}
            />

            <Polyline
              positions={path}
              pathOptions={{ color: "blue", weight: 4 }}
            />

            <Marker position={currentPoint}>
              <Popup>
                目前位置
                <br />
                GPS：{gpsAccuracy.toFixed(0)} m
                <br />
                速度：{speed.toFixed(0)} km/h
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      <p style={{ fontSize: 13, color: "#666" }}>
        起點：紅線，移動路徑穿越 + 往終點方向 + 速度 {MIN_START_SPEED_KMH} km/h 以上
        <br />
        終點：綠線，移動路徑穿越即完賽
        <br />
        GPS 精度限制：{MAX_GPS_ACCURACY_M}m
      </p>

      {finishTime && (
        <>
          <hr />
          <h2>🏆 完賽成績</h2>
          <h1>{formatTime(finishTime)}</h1>
          <h3>平均速度：{avgSpeed.toFixed(1)} km/h</h3>
        </>
      )}
    </div>
  );
}
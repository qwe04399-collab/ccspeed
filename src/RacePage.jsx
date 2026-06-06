import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// =======================
// 測試模式開關
// true  = 在家測試，GPS 回傳後自動開始，5 秒後完賽
// false = 正式路試，穿越起點線開始，穿越終點線完賽
// =======================
const TEST_MODE = true;

// 起點線

//終點線


const MIN_START_SPEED_KMH = 5;
const MAX_VALID_SPEED_KMH = 180;

// =======================
// GPS 精度限制
// 測試模式放寬到 999m
// 正式模式限制 15m
// =======================
const MAX_GPS_ACCURACY_M = TEST_MODE ? 999 : 15;

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

  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
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

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(centiseconds).padStart(2, "0")}`;
}

export default function RacePage({ nickname, vehicleType, vehicleModel, track, onBack }) {
  const startLine = useMemo(
    () => [
      [track.start_left_lat, track.start_left_lng],
      [track.start_right_lat, track.start_right_lng],
    ],
    [
      track.start_left_lat,
      track.start_left_lng,
      track.start_right_lat,
      track.start_right_lng,
    ]
  );

  const endLine = useMemo(
    () => [
      [track.finish_left_lat, track.finish_left_lng],
      [track.finish_right_lat, track.finish_right_lng],
    ],
    [
      track.finish_left_lat,
      track.finish_left_lng,
      track.finish_right_lat,
      track.finish_right_lng,
    ]
  );

  const pointA = track.start_name || "起點";
  const pointB = track.finish_name || "終點";

  const forwardDirection = useMemo(() => `${pointA}→${pointB}`, [pointA, pointB]);
  const reverseDirection = useMemo(() => `${pointB}→${pointA}`, [pointA, pointB]);


  const [status, setStatus] = useState("等待起跑");
  const [direction, setDirection] = useState("偵測中");
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
  const [backgroundWarning, setBackgroundWarning] = useState(
    "挑戰期間請保持此頁面開啟，請勿鎖螢幕或切換到其他 App。"
  );
  const [backgroundCount, setBackgroundCount] = useState(0);

  const watchRef = useRef(null);
  const statusRef = useRef("等待起跑");
  const directionRef = useRef("偵測中");
  const startTimeRef = useRef(null);

  const lastPointRef = useRef(null);
  const lastTimeRef = useRef(null);

  const speedRef = useRef(0);
  const speedListRef = useRef([]);
  const savedRef = useRef(false);
  const invalidRaceRef = useRef(false);

  const setRaceStatus = (nextStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  };

  const setRaceDirection = (nextDirection) => {
    directionRef.current = nextDirection;
    setDirection(nextDirection);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (statusRef.current === "計時中" && startTimeRef.current) {
        setTimer(Date.now() - startTimeRef.current);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && statusRef.current === "計時中") {
        invalidRaceRef.current = true;
        setBackgroundCount((count) => count + 1);
        setBackgroundWarning(
          "⚠️ 挑戰中偵測到切換背景或鎖螢幕，為避免 GPS 中斷，本次挑戰已中斷，請重新開始。"
        );
        setRaceStatus("挑戰中斷");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const saveResult = useCallback(async (finalTime, avg) => {
    if (savedRef.current) return;
    savedRef.current = true;

    // 測試模式也要能寫入資料庫：所有 runs 必填欄位都補上預設值，避免 null 寫入失敗
    const finalNickname = nickname?.trim() || "5秒測試玩家";
    const finalVehicleType = vehicleType?.trim() || "機車";
    const finalVehicleModel = vehicleModel?.trim() || "5秒測試車款";
    const finalDirection = directionRef.current || "測試模式";

    const { error } = await supabase.from("runs").insert([
      {
        nickname: finalNickname,
        track_id: track?.id,
        direction: finalDirection,
        track_name: track?.name || "測試賽道",
        vehicle_type: finalVehicleType,
        vehicle_model: finalVehicleModel,
        elapsed_ms: finalTime,
        avg_speed: Number.isFinite(avg) ? avg : 0,
        max_speed: Number.isFinite(speedRef.current) ? speedRef.current : 0,
        finish_time: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("資料庫寫入失敗", error);
      alert("資料庫寫入失敗：" + error.message);
      savedRef.current = false;
    } else {
      alert(TEST_MODE ? "✅ 5秒測試成績已儲存到 runs" : "🏆 成績已儲存到 runs");
    }
  }, [nickname, track?.id, track?.name, vehicleType, vehicleModel]);

  function resetRace() {
    setRaceStatus("等待起跑");
    setRaceDirection("偵測中");
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
    invalidRaceRef.current = false;
    setBackgroundCount(0);
    setBackgroundWarning("挑戰期間請保持此頁面開啟，請勿鎖螢幕或切換到其他 App。");
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

        if (invalidRaceRef.current) {
          lastPointRef.current = point;
          lastTimeRef.current = now;
          return;
        }

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

        const crossedStartLine = crossedLine(prevPoint, point, startLine);
        const crossedEndLine = crossedLine(prevPoint, point, endLine);

        // =======================
        // 起跑判斷
        // TEST_MODE：GPS 回傳後直接開始
        // 正式模式：穿越楠西線或大埔線才開始
        // =======================
        if (statusRef.current === "等待起跑") {
          if (TEST_MODE) {
            setRaceDirection(forwardDirection);
            startTimeRef.current = Date.now();
            speedListRef.current = [];
            setTimer(0);
            setRaceStatus("計時中");
          } else if (finalSpeed >= MIN_START_SPEED_KMH) {
            
            if (crossedStartLine) {
              setRaceDirection(forwardDirection);
              startTimeRef.current = Date.now();
              speedListRef.current = [];
              setTimer(0);
              setRaceStatus("計時中");
            }

            if (crossedEndLine) {
              setRaceDirection(reverseDirection);
              startTimeRef.current = Date.now();
              speedListRef.current = [];
              setTimer(0);
              setRaceStatus("計時中");
            }
          }
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

        const shouldFinishForward =
          statusRef.current === "計時中" &&
          directionRef.current === forwardDirection &&
          crossedEndLine;

        const shouldFinishReverse =
          statusRef.current === "計時中" &&
          directionRef.current === reverseDirection &&
          crossedStartLine;

        // =======================
        // 完賽判斷
        // TEST_MODE：5 秒後自動完賽
        // 正式模式：依方向穿越對應終點線完賽
        // =======================
        const shouldFinishTest =
          TEST_MODE &&
          statusRef.current === "計時中" &&
          Date.now() - startTimeRef.current > 5000;

        const shouldFinishOfficial =
          !TEST_MODE && (shouldFinishForward || shouldFinishReverse);

        if (!invalidRaceRef.current && (shouldFinishTest || shouldFinishOfficial)) {
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
  }, [
    endLine,
    forwardDirection,
    nickname,
    reverseDirection,
    saveResult,
    startLine,
    track,
    vehicleModel,
    vehicleType,
  ]);

  return (
    <div style={{ textAlign: "center", padding: 16, fontFamily: "Arial" }}>
      <h1>🏁 CCSPEED</h1>

      <h2>{status}</h2>
      <h3>方向：{direction}</h3>
      <p>{TEST_MODE ? "5秒測試模式" : "GPS正常"}</p>

      <div
        style={{
          margin: "12px auto",
          padding: "12px 14px",
          maxWidth: 520,
          borderRadius: 12,
          background: status === "挑戰中斷" ? "#3b1212" : "#1f2937",
          color: "#fff",
          lineHeight: 1.5,
        }}
      >
        <strong>📱 前景定位提醒</strong>
        <br />
        {backgroundWarning}
        {backgroundCount > 0 && (
          <div style={{ marginTop: 6 }}>切換背景次數：{backgroundCount}</div>
        )}
      </div>

      <div style={{ fontSize: 46, fontWeight: "bold", margin: "18px 0" }}>
        {formatTime(finishTime ?? timer)}
      </div>

      <h3>當前速度：{speed.toFixed(0)} km/h</h3>
      <h3>平均速度：{avgSpeed.toFixed(1)} km/h</h3>

      {status === "挑戰中斷" && (
        <div style={{ color: "#ff4d4f", fontWeight: "bold", marginBottom: 12 }}>
          本次挑戰已中斷，請按「重新開始」後再挑戰。
        </div>
      )}

      <hr />

      <p>
      GPS 精度：{gpsAccuracy.toFixed(0)} m　
      {gpsAccuracy <= 15 ? "✅ 可計時" : "⚠️ GPS不穩"}
      </p>
      <p>起點({pointA})：{startDist.toFixed(1)} m</p>
      <p>終點({pointB})：{endDist.toFixed(1)} m</p>
      
      <button onClick={onBack} style={{ padding: "10px 16px", margin: 6 }}>
      返回首頁
      </button>
      
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

            <Polyline positions={startLine} pathOptions={{ color: "red", weight: 7 }} />
            <Polyline positions={endLine} pathOptions={{ color: "lime", weight: 7 }} />
            <Polyline positions={path} pathOptions={{ color: "blue", weight: 4 }} />

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

      {finishTime && (
        <>
          <hr />
          <h2>🏆 完賽成績</h2>
          <h1>{formatTime(finishTime)}</h1>
          <h3>方向：{direction}</h3>
          <h3>平均速度：{avgSpeed.toFixed(1)} km/h</h3>

      {status === "挑戰中斷" && (
        <div style={{ color: "#ff4d4f", fontWeight: "bold", marginBottom: 12 }}>
          本次挑戰已中斷，請按「重新開始」後再挑戰。
        </div>
      )}
        </>
      )}
    </div>
  );
}

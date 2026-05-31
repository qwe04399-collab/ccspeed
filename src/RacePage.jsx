import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// ======================
// 起點線
// ======================
const startLine = [
  [22.843293, 120.247413],
  [22.843517, 120.247618],
];

// ======================
// 終點線
// ======================
const endLine = [
  [22.825971, 120.272488],
  [22.826082, 120.272547],
];

// ======================
// 點到線距離
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

  return Math.sqrt(dx * dx + dy * dy) * 111000;
}

// ======================
// 時間格式
// ======================
function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(centiseconds).padStart(2, "0")}`;
}

export default function RacePage({
  nickname,
  vehicleType,
  vehicleModel,
}) {
  const [status, setStatus] = useState("等待起跑");
  const [speed, setSpeed] = useState(0);

  const [startTime, setStartTime] = useState(null);
  const [finishTime, setFinishTime] = useState(null);

  const [timer, setTimer] = useState(0);

  const [avgSpeed, setAvgSpeed] = useState(0);
  const [speedList, setSpeedList] = useState([]);

  const watchRef = useRef(null);

  // 計時器刷新
  useEffect(() => {
    const interval = setInterval(() => {
      if (startTime && !finishTime) {
        setTimer(Date.now() - startTime);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [startTime, finishTime]);

  // GPS
  useEffect(() => {
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const currentSpeed = Math.max(
          0,
          (pos.coords.speed || 0) * 3.6
        );

        setSpeed(currentSpeed);

        if (currentSpeed > 5) {
          setSpeedList((prev) => [...prev, currentSpeed]);
        }

        const point = [lat, lng];

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

        // 進入起跑區
        if (status === "等待起跑" && startDist < 15) {
          setStatus("準備起跑");
        }

        // 離開起跑區
        if (
          status === "準備起跑" &&
          startDist > 20
        ) {
          setStatus("計時中");
          setStartTime(Date.now());
        }

        // 終點
        if (
          status === "計時中" &&
          endDist < 15
        ) {
          const finalTime =
            Date.now() - startTime;

          setFinishTime(finalTime);
          setStatus("完賽");

          const avg =
            speedList.length > 0
              ? speedList.reduce(
                  (a, b) => a + b,
                  0
                ) / speedList.length
              : 0;

          setAvgSpeed(avg);

          // 存入資料庫
          
          console.log("準備寫入資料庫");
          await supabase
            .from("leaderboard")
            .insert([
              {
                nickname,
                vehicle_type: vehicleType,
                vehicle_model: vehicleModel,
                time_ms: finalTime,
                avg_speed: avg,
              },
            ]);
            console.log("資料已送出");
        }
      },
      console.error,
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
  }, [
    status,
    startTime,
    speedList,
    nickname,
    vehicleType,
    vehicleModel,
  ]);

  return (
    <div
      style={{
        textAlign: "center",
        padding: 20,
      }}
    >
      <h1>🏁 CCSPEED</h1>

      <h2>{status}</h2>

      <div
        style={{
          fontSize: 48,
          fontWeight: "bold",
          margin: 20,
        }}
      >
        {formatTime(
          finishTime ?? timer
        )}
      </div>

      <h3>
        🚗 速度：
        {speed.toFixed(0)} km/h
      </h3>

      <h3>
        📊 平均速度：
        {avgSpeed.toFixed(1)} km/h
      </h3>

      {finishTime && (
        <>
          <h2>🏆 完賽成績</h2>
          <h2>{formatTime(finishTime)}</h2>
        </>
      )}
    </div>
  );
}
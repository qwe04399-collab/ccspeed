import { useEffect, useRef, useState } from "react";

export default function App() {
  // =========================
  // 🏁 CCSPEED v8
  // 虛擬起跑線版本
  // =========================

  // 起點（宿舍）
  const START = {
    lat: 22.8433342,
    lng: 120.2476623,
  };

  // 終點（公司）
  const END = {
    lat: 22.82559,
    lng: 120.272564,
  };

  // =========================
  // 虛擬線寬（公尺）
  // =========================
  const START_LINE_WIDTH = 15;
  const END_LINE_WIDTH = 25;

  // =========================
  // UI State
  // =========================
  const [status, setStatus] =
    useState("等待GPS");

  const [time, setTime] = useState(0);

  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const [speed, setSpeed] = useState(0);

  const [dStart, setDStart] = useState(0);
  const [dEnd, setDEnd] = useState(0);

  const [result, setResult] = useState("");

  // =========================
  // refs
  // =========================
  const watchRef = useRef(null);

  const timerRef = useRef(null);

  const startTimeRef = useRef(0);

  const prevPosRef = useRef(null);

  const stateRef = useRef("IDLE");

  // =========================
  // Moving Average
  // =========================
  const latBuf = useRef([]);
  const lngBuf = useRef([]);
  const speedBuf = useRef([]);

  const WINDOW = 5;

  // =========================
  // Helpers
  // =========================
  function avg(arr) {
    return (
      arr.reduce((a, b) => a + b, 0) /
      arr.length
    );
  }

  function pushBuffer(buf, val) {
    buf.current.push(val);

    if (buf.current.length > WINDOW) {
      buf.current.shift();
    }

    return avg(buf.current);
  }

  // =========================
  // GPS distance
  // =========================
  function getDistance(a, b) {
    const R = 6371000;

    const dLat =
      ((b.lat - a.lat) * Math.PI) / 180;

    const dLng =
      ((b.lng - a.lng) * Math.PI) / 180;

    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return (
      2 * R * Math.asin(Math.sqrt(x))
    );
  }

  // =========================
  // 🏁 Cross Line Detection
  // =========================
  function crossedLine(
    prev,
    curr,
    target,
    width
  ) {
    if (!prev) return false;

    const prevDist = getDistance(
      prev,
      target
    );

    const currDist = getDistance(
      curr,
      target
    );

    // 穿越條件：
    // 前一點在線外
    // 現在在線內

    return (
      prevDist > width &&
      currDist <= width
    );
  }

  // =========================
  // 計時格式
  // =========================
  function formatTime(ms) {
    const t = ms / 1000;

    const m = Math.floor(t / 60);

    const s = Math.floor(t % 60);

    const cs = Math.floor(
      (ms % 1000) / 10
    );

    return (
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0") +
      "." +
      String(cs).padStart(2, "0")
    );
  }

  // =========================
  // 啟動 GPS
  // =========================
  const startGPS = () => {
    if (watchRef.current) return;

    setStatus("GPS啟動中");

    watchRef.current =
      navigator.geolocation.watchPosition(
        (pos) => {
          // =========================
          // GPS 平滑
          // =========================
          const sLat = pushBuffer(
            latBuf,
            pos.coords.latitude
          );

          const sLng = pushBuffer(
            lngBuf,
            pos.coords.longitude
          );

          const sSpeed = pushBuffer(
            speedBuf,
            pos.coords.speed || 0
          );

          const curr = {
            lat: sLat,
            lng: sLng,
          };

          setLat(sLat);
          setLng(sLng);

          setSpeed(sSpeed);

          // =========================
          // 距離
          // =========================
          const ds = getDistance(
            curr,
            START
          );

          const de = getDistance(
            curr,
            END
          );

          setDStart(ds);

          setDEnd(de);

          // =========================
          // 🟢 START LINE
          // =========================
          if (
            stateRef.current ===
              "IDLE" &&
            crossedLine(
              prevPosRef.current,
              curr,
              START,
              START_LINE_WIDTH
            ) &&
            sSpeed > 1
          ) {
            stateRef.current =
              "TIMING";

            setStatus("開始計時");

            startTimeRef.current =
              Date.now();

            timerRef.current =
              setInterval(() => {
                setTime(
                  Date.now() -
                    startTimeRef.current
                );
              }, 100);
          }

          // =========================
          // 🔴 END LINE
          // =========================
          if (
            stateRef.current ===
              "TIMING" &&
            crossedLine(
              prevPosRef.current,
              curr,
              END,
              END_LINE_WIDTH
            )
          ) {
            stateRef.current =
              "FINISHED";

            clearInterval(
              timerRef.current
            );

            setStatus("已抵達終點");

            setResult(
              formatTime(
                Date.now() -
                  startTimeRef.current
              )
            );
          }

          // 更新上一點
          prevPosRef.current = curr;
        },
        (err) => {
          console.log(err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
  };

  // =========================
  // 清除 timer
  // =========================
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (watchRef.current) {
        navigator.geolocation.clearWatch(
          watchRef.current
        );
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial",
      }}
    >
      <h1>
        CCSPEED v8 虛擬起跑線
      </h1>

      <button onClick={startGPS}>
        啟動 GPS
      </button>

      <h2>{status}</h2>

      <h1
        style={{
          fontSize: 42,
        }}
      >
        {formatTime(time)}
      </h1>

      <hr />

      <p>
        📍{" "}
        {lat.toFixed(6)},
        {" "}
        {lng.toFixed(6)}
      </p>

      <p>
        🚗 速度：
        {" "}
        {(speed * 3.6).toFixed(1)}
        {" "}
        km/h
      </p>

      <p>
        起點距離：
        {" "}
        {dStart.toFixed(0)}
        {" "}
        m
      </p>

      <p>
        終點距離：
        {" "}
        {dEnd.toFixed(0)}
        {" "}
        m
      </p>

      <hr />

      <h2>🏁 本次成績</h2>

      <h1>{result}</h1>
    </div>
  );
}
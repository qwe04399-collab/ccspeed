import { useEffect, useRef, useState } from "react";

export default function App() {
  // =========================
  // 🏁 起點線（宿舍）
  // =========================
  const START_LINE = {
    A: { lat: 22.843293, lng: 120.247413 },
    B: { lat: 22.843517, lng: 120.247618 },
  };

  // =========================
  // 🏁 終點線（公司）
  // =========================
  const END_LINE = {
    A: { lat: 22.825971, lng: 120.272488 },
    B: { lat: 22.826082, lng: 120.272547 },
  };

  // =========================
  // UI state
  // =========================
  const [status, setStatus] = useState("等待GPS");
  const [time, setTime] = useState(0);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [speed, setSpeed] = useState(0);
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
  // moving average buffer
  // =========================
  const latBuf = useRef([]);
  const lngBuf = useRef([]);
  const speedBuf = useRef([]);
  const WINDOW = 5;

  function avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function pushBuffer(buf, val) {
    buf.current.push(val);
    if (buf.current.length > WINDOW) buf.current.shift();
    return avg(buf.current);
  }

  // =========================
  // distance
  // =========================
  function getDistance(a, b) {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;

    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(x));
  }

  // =========================
  // 🏁 線段穿越判斷（核心）
  // =========================
  function crossLine(prev, curr, A, B) {
    if (!prev) return false;

    const sign = (p, a, b) =>
      (b.lng - a.lng) * (p.lat - a.lat) -
      (b.lat - a.lat) * (p.lng - a.lng);

    const prevSign = sign(prev, A, B);
    const currSign = sign(curr, A, B);

    return prevSign * currSign < 0;
  }

  // =========================
  // time format
  // =========================
  function formatTime(ms) {
    const t = ms / 1000;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const cs = Math.floor((ms % 1000) / 10);

    return (
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0") +
      "." +
      String(cs).padStart(2, "0")
    );
  }

  // =========================
  // GPS start
  // =========================
  const startGPS = () => {
    if (watchRef.current) return;

    setStatus("GPS啟動中");

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        const rawSpeed = pos.coords.speed || 0;

        // =========================
        // 平滑
        // =========================
        const sLat = pushBuffer(latBuf, rawLat);
        const sLng = pushBuffer(lngBuf, rawLng);
        const sSpeed = pushBuffer(speedBuf, rawSpeed);

        const curr = { lat: sLat, lng: sLng };

        setLat(sLat);
        setLng(sLng);
        setSpeed(sSpeed);

        // =========================
        // 🟢 START LINE
        // =========================
        if (
          stateRef.current === "IDLE" &&
          crossLine(
            prevPosRef.current,
            curr,
            START_LINE.A,
            START_LINE.B
          ) &&
          sSpeed > 1
        ) {
          stateRef.current = "TIMING";
          setStatus("開始計時");

          startTimeRef.current = Date.now();

          timerRef.current = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
          }, 100);
        }

        // =========================
        // 🔴 END LINE
        // =========================
        if (
          stateRef.current === "TIMING" &&
          crossLine(
            prevPosRef.current,
            curr,
            END_LINE.A,
            END_LINE.B
          )
        ) {
          stateRef.current = "FINISHED";
          clearInterval(timerRef.current);

          setStatus("已完成");

          setResult(
            formatTime(
              Date.now() - startTimeRef.current
            )
          );
        }

        prevPosRef.current = curr;
      },
      (err) => console.log(err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(
          watchRef.current
        );
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>CCSPEED v8 線段起跑系統</h1>

      <button onClick={startGPS}>
        啟動 GPS
      </button>

      <h2>{status}</h2>

      <h1 style={{ fontSize: 42 }}>
        {formatTime(time)}
      </h1>

      <hr />

      <p>
        📍 {lat.toFixed(6)}, {lng.toFixed(6)}
      </p>

      <p>
        🚗 {(speed * 3.6).toFixed(1)} km/h
      </p>

      <hr />

      <h2>🏁 成績</h2>
      <h1>{result}</h1>
    </div>
  );
}
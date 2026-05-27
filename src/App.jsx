import { useRef, useState } from "react";

export default function App() {
  const START = { lat: 22.842872, lng: 120.245578 };
  const END = { lat: 22.825590, lng: 120.272564 };

  const [state, setState] = useState("IDLE");
  const [time, setTime] = useState(0);

  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const [speed, setSpeed] = useState(0);

  const [dStart, setDStart] = useState(0);
  const [dEnd, setDEnd] = useState(0);

  const watchRef = useRef(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // ===== EMA 濾波係數（越小越穩）=====
  const alpha = 0.2;

  const emaRef = useRef({
    lat: null,
    lng: null,
    speed: 0,
    dStart: 0,
    dEnd: 0,
  });

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

  function ema(prev, current) {
    return prev === null
      ? current
      : prev * (1 - alpha) + current * alpha;
  }

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

  const startGPS = () => {
    if (watchRef.current) return;

    setState("RUNNING");

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        let rawLat = pos.coords.latitude;
        let rawLng = pos.coords.longitude;
        let rawSpeed = pos.coords.speed || 0;

        // =========================
        // 🟢 1. GPS EMA 濾波
        // =========================
        emaRef.current.lat = ema(emaRef.current.lat, rawLat);
        emaRef.current.lng = ema(emaRef.current.lng, rawLng);

        const smoothLat = emaRef.current.lat;
        const smoothLng = emaRef.current.lng;

        // =========================
        // 🟢 2. 異常值過濾（跳點防護）
        // =========================
        const distJump =
          getDistance(
            { lat: rawLat, lng: rawLng },
            { lat: smoothLat, lng: smoothLng }
          );

        if (distJump > 50) {
          // 忽略這筆（GPS炸點）
          return;
        }

        // =========================
        // 🟢 3. speed EMA
        // =========================
        emaRef.current.speed = ema(
          emaRef.current.speed,
          rawSpeed
        );

        const smoothSpeed = emaRef.current.speed;

        const p = {
          lat: smoothLat,
          lng: smoothLng,
        };

        setLat(smoothLat);
        setLng(smoothLng);
        setSpeed(smoothSpeed);

        const ds = getDistance(p, START);
        const de = getDistance(p, END);

        // =========================
        // 🟢 4. 距離 EMA
        // =========================
        emaRef.current.dStart = ema(emaRef.current.dStart, ds);
        emaRef.current.dEnd = ema(emaRef.current.dEnd, de);

        const sStart = emaRef.current.dStart;
        const sEnd = emaRef.current.dEnd;

        setDStart(sStart);
        setDEnd(sEnd);

        // =========================
        // 🟢 START（穩定 + 車速）
        // =========================
        if (
          state === "RUNNING" &&
          sStart < 100 &&
          smoothSpeed > 0.5
        ) {
          setState("TIMING");

          startTimeRef.current = Date.now();

          timerRef.current = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
          }, 100);
        }

        // =========================
        // 🟢 STOP
        // =========================
        if (state === "TIMING" && sEnd < 100) {
          setState("FINISHED");
          clearInterval(timerRef.current);
        }
      },
      (err) => console.log(err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>CCSPEED v5（高精度濾波）</h1>

      <button onClick={startGPS}>
        啟動GPS
      </button>

      <h2>狀態：{state}</h2>

      <h1 style={{ fontSize: 40 }}>
        {formatTime(time)}
      </h1>

      <hr />

      <p>
        📍 {lat.toFixed(6)}, {lng.toFixed(6)}
      </p>

      <p>
        🚗 速度：{(speed * 3.6).toFixed(1)} km/h
      </p>

      <p>
        起點距離：{dStart.toFixed(0)} m
      </p>

      <p>
        終點距離：{dEnd.toFixed(0)} m
      </p>
    </div>
  );
}
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

  // =========================
  // 🟢 Moving Average Buffers
  // =========================
  const latBuf = useRef([]);
  const lngBuf = useRef([]);
  const speedBuf = useRef([]);

  const DIST_BUF = useRef([]);

  const WINDOW = 5; // 越大越穩，但延遲越高

  // =========================
  // 🟢 EMA factor
  // =========================
  const alpha = 0.3;

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

  function avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function ema(prev, curr) {
    return prev === null
      ? curr
      : prev * (1 - alpha) + curr * alpha;
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

  const pushBuffer = (buf, val) => {
    buf.current.push(val);
    if (buf.current.length > WINDOW) {
      buf.current.shift();
    }
    return avg(buf.current);
  };

  const startGPS = () => {
    if (watchRef.current) return;

    setState("RUNNING");

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        const rawSpeed = pos.coords.speed || 0;

        // =========================
        // 🟢 1. Moving Average（核心）
        // =========================
        const mLat = pushBuffer(latBuf, rawLat);
        const mLng = pushBuffer(lngBuf, rawLng);
        const mSpeed = pushBuffer(speedBuf, rawSpeed);

        // =========================
        // 🟢 2. EMA（二次平滑）
        // =========================
        emaRef.current.lat = ema(emaRef.current.lat, mLat);
        emaRef.current.lng = ema(emaRef.current.lng, mLng);
        emaRef.current.speed = ema(emaRef.current.speed, mSpeed);

        const sLat = emaRef.current.lat;
        const sLng = emaRef.current.lng;
        const sSpeed = emaRef.current.speed;

        const p = { lat: sLat, lng: sLng };

        setLat(sLat);
        setLng(sLng);
        setSpeed(sSpeed);

        // =========================
        // 距離計算
        // =========================
        const ds = getDistance(p, START);
        const de = getDistance(p, END);

        const mDs = pushBuffer(DIST_BUF, ds);
        const mDe = de; // STOP 不需要太嚴

        setDStart(mDs);
        setDEnd(mDe);

        // =========================
        // 🟢 START（車速 + 穩定）
        // =========================
        if (
          state === "RUNNING" &&
          mDs < 100 &&
          sSpeed > 0.5
        ) {
          setState("TIMING");

          startTimeRef.current = Date.now();

          timerRef.current = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
          }, 100);
        }

        // =========================
        // 🔴 STOP
        // =========================
        if (state === "TIMING" && mDe < 100) {
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
      <h1>CCSPEED v6</h1>

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
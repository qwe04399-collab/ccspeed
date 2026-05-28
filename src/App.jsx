import { useRef, useState } from "react";

export default function App() {
  // 起點（宿舍）
  const START = {
    lat: 22.8433342,
    lng: 120.2476623,
  };

  // 終點（公司）
  const END = {
    lat: 22.825590,
    lng: 120.272564,
  };

  const START_RADIUS = 100;
  const END_RADIUS = 100;

  const [status, setStatus] = useState("等待GPS");
  const [time, setTime] = useState(0);

  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const [speed, setSpeed] = useState(0);

  const [dStart, setDStart] = useState(0);
  const [dEnd, setDEnd] = useState(0);

  const [result, setResult] = useState("");

  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  const watchRef = useRef(null);

  // 狀態機
  const stateRef = useRef("IDLE");

  // GPS Buffer
  const latBuf = useRef([]);
  const lngBuf = useRef([]);
  const speedBuf = useRef([]);

  const WINDOW = 5;

  function avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function pushBuffer(buf, val) {
    buf.current.push(val);

    if (buf.current.length > WINDOW) {
      buf.current.shift();
    }

    return avg(buf.current);
  }

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

    setStatus("GPS啟動");

    watchRef.current =
      navigator.geolocation.watchPosition(
        (pos) => {
          // =========================
          // 平滑 GPS
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

          setLat(sLat);
          setLng(sLng);
          setSpeed(sSpeed);

          const p = {
            lat: sLat,
            lng: sLng,
          };

          const ds = getDistance(p, START);
          const de = getDistance(p, END);

          setDStart(ds);
          setDEnd(de);

          // =========================
          // 🟢 1. 進入起點區域
          // =========================
          if (
            stateRef.current === "IDLE" &&
            ds < START_RADIUS
          ) {
            stateRef.current = "READY";

            setStatus("已進入起點");
          }

          // =========================
          // 🟢 2. 離開起點 → 開始計時
          // =========================
          if (
            stateRef.current === "READY" &&
            ds > START_RADIUS &&
            sSpeed > 1
          ) {
            stateRef.current = "TIMING";

            setStatus("開始計時");

            startTimeRef.current = Date.now();

            timerRef.current = setInterval(() => {
              setTime(
                Date.now() - startTimeRef.current
              );
            }, 100);
          }

          // =========================
          // 🔴 3. 進入終點 → 停止
          // =========================
          if (
            stateRef.current === "TIMING" &&
            de < END_RADIUS
          ) {
            stateRef.current = "FINISHED";

            clearInterval(timerRef.current);

            setStatus("已抵達終點");
          }

          // =========================
          // 🏁 4. 離開終點 → 顯示成績
          // =========================
          if (
            stateRef.current === "FINISHED" &&
            de > END_RADIUS
          ) {
            stateRef.current = "RESULT";

            setResult(formatTime(time));

            setStatus("成績完成");
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
      <h1>CCSPEED v7</h1>

      <button onClick={startGPS}>
        啟動GPS
      </button>

      <h2>{status}</h2>

      <h1 style={{ fontSize: 40 }}>
        {formatTime(time)}
      </h1>

      <hr />

      <p>
        📍 {lat.toFixed(6)}, {lng.toFixed(6)}
      </p>

      <p>
        🚗 速度：
        {(speed * 3.6).toFixed(1)} km/h
      </p>

      <p>
        起點距離：
        {dStart.toFixed(0)} m
      </p>

      <p>
        終點距離：
        {dEnd.toFixed(0)} m
      </p>

      <hr />

      <h2>🏁 本次成績</h2>

      <h1>{result}</h1>
    </div>
  );
}
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

  const watchIdRef = useRef(null);

  const startBufferRef = useRef([]);
  const endBufferRef = useRef([]);

  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

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

  function formatTime(ms) {
    const total = ms / 1000;
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
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
    if (watchIdRef.current !== null) return;

    setState("RUNNING");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed || 0,
        };

        setLat(p.lat);
        setLng(p.lng);
        setSpeed(p.speed);

        const ds = getDistance(p, START);
        const de = getDistance(p, END);

        // 平滑
        startBufferRef.current.push(ds);
        if (startBufferRef.current.length > 3) {
          startBufferRef.current.shift();
        }

        endBufferRef.current.push(de);
        if (endBufferRef.current.length > 3) {
          endBufferRef.current.shift();
        }

        const smoothStart = avg(startBufferRef.current);
        const smoothEnd = avg(endBufferRef.current);

        setDStart(smoothStart);
        setDEnd(smoothEnd);

        // 🟢 START（車輛移動才允許）
        if (
          state === "RUNNING" &&
          smoothStart < 100 &&
          p.speed > 0.5
        ) {
          setState("TIMING");

          startTimeRef.current = Date.now();

          timerRef.current = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
          }, 100);
        }

        // 🔴 STOP
        if (state === "TIMING" && smoothEnd < 100) {
          setState("FINISHED");
          clearInterval(timerRef.current);
        }
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

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>CCSPEED v4</h1>

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
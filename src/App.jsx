import { useEffect, useRef, useState } from "react";

export default function App() {
  const START = { lat: 22.842872, lng: 120.245578 };
  const END = { lat: 22.825590, lng: 120.272564 };

  const [status, setStatus] = useState("等待GPS");
  const [time, setTime] = useState(0);

  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const [distanceStart, setDistanceStart] = useState(0);
  const [distanceEnd, setDistanceEnd] = useState(0);

  const [running, setRunning] = useState(false);

  const startedRef = useRef(false);
  const stoppedRef = useRef(false);

  const startTimerRef = useRef(null);
  const intervalRef = useRef(null);

  const startStableCountRef = useRef(0);
  const endStableCountRef = useRef(0);

  // 距離計算
  function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(a));
  }

  const startGPS = () => {
    setStatus("GPS監測中");

    navigator.geolocation.watchPosition(
      (pos) => {
        const cLat = pos.coords.latitude;
        const cLng = pos.coords.longitude;

        setLat(cLat);
        setLng(cLng);

        const dStart = getDistance(cLat, cLng, START.lat, START.lng);
        const dEnd = getDistance(cLat, cLng, END.lat, END.lng);

        setDistanceStart(dStart);
        setDistanceEnd(dEnd);

        // =========================
        // 🟢 START 防抖（3次穩定才觸發）
        // =========================
        if (dStart < 100) {
          startStableCountRef.current += 1;
        } else {
          startStableCountRef.current = 0;
        }

        if (
          !startedRef.current &&
          startStableCountRef.current >= 3
        ) {
          startedRef.current = true;

          setStatus("開始計時");
          setRunning(true);

          startTimerRef.current = Date.now();

          intervalRef.current = setInterval(() => {
            setTime(
              (Date.now() - startTimerRef.current) / 1000
            );
          }, 100);
        }

        // =========================
        // 🔴 STOP 防抖（3次穩定才觸發）
        // =========================
        if (dEnd < 100) {
          endStableCountRef.current += 1;
        } else {
          endStableCountRef.current = 0;
        }

        if (
          startedRef.current &&
          !stoppedRef.current &&
          endStableCountRef.current >= 3
        ) {
          stoppedRef.current = true;

          setRunning(false);
          setStatus("完成");

          clearInterval(intervalRef.current);
        }
      },
      (err) => {
        console.log(err);
        setStatus("GPS錯誤");
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
      <h1>CCSPEED v2</h1>

      <button onClick={startGPS}>
        開始GPS
      </button>

      <h2>{status}</h2>

      <h1>{time.toFixed(2)} s</h1>

      <hr />

      <p>
        📍 目前位置：{lat.toFixed(6)}, {lng.toFixed(6)}
      </p>

      <p>
        距起點：{distanceStart.toFixed(0)} m
      </p>

      <p>
        距終點：{distanceEnd.toFixed(0)} m
      </p>
    </div>
  );
}
import { useEffect, useState, useRef } from "react";

export default function App() {
  // 起點（宿舍）
  const START = {
    lat: 22.842872,
    lng: 120.245578,
  };

  // 終點（公司）
  const END = {
    lat: 22.825590,
    lng: 120.272564,
  };

  const [running, setRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const [time, setTime] = useState(0);

  const [distanceToStart, setDistanceToStart] = useState(0);
  const [distanceToEnd, setDistanceToEnd] = useState(0);

  const [currentLat, setCurrentLat] = useState(0);
  const [currentLng, setCurrentLng] = useState(0);

  const [status, setStatus] = useState("等待GPS");

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // 計算距離（公尺）
  function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;

    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) *
        Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  const startGPS = () => {
    setStatus("GPS監測中");

    navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCurrentLat(lat);
        setCurrentLng(lng);

        const dStart = getDistance(lat, lng, START.lat, START.lng);
        const dEnd = getDistance(lat, lng, END.lat, END.lng);

        setDistanceToStart(dStart);
        setDistanceToEnd(dEnd);

        // 🟢 START（只觸發一次）
        if (!hasStarted && dStart < 100) {
          setHasStarted(true);
          setRunning(true);

          startTimeRef.current = Date.now();

          timerRef.current = setInterval(() => {
            setTime(
              (Date.now() - startTimeRef.current) / 1000
            );
          }, 100);

          setStatus("計時開始");
        }

        // 🔴 STOP（只在 running 時觸發）
        if (running && dEnd < 100) {
          setRunning(false);
          clearInterval(timerRef.current);

          setStatus("抵達終點");
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
      <h1>CCSPEED</h1>

      <button onClick={startGPS}>
        開始GPS
      </button>

      <h2>{status}</h2>

      <h1>{time.toFixed(2)} s</h1>

      <hr />

      <h3>目前GPS座標</h3>
      <p>
        {currentLat}, {currentLng}
      </p>

      <hr />

      <p>
        距起點：{distanceToStart.toFixed(0)} m
      </p>

      <p>
        距終點：{distanceToEnd.toFixed(0)} m
      </p>
    </div>
  );
}
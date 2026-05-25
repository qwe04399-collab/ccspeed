import { useState, useRef } from "react";

const START = {
  lat: 23.186069,
  lng: 120.490847
};

const END = {
  lat: 23.291001,
  lng: 120.593832
};

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function App() {
  const [status, setStatus] = useState("等待GPS");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  const startRef = useRef(null);
  const timerRef = useRef(null);

  const startTimer = () => {
    startRef.current = Date.now();
    setRunning(true);

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);
  };

  const stopTimer = () => {
    setRunning(false);
    clearInterval(timerRef.current);
  };

  const startGPS = () => {
    if (!navigator.geolocation) {
      setStatus("不支援GPS");
      return;
    }

    setStatus("GPS監測中...");

    navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude } = pos.coords;

      const dStart = getDistance(latitude, longitude, START.lat, START.lng);
      const dEnd = getDistance(latitude, longitude, END.lat, END.lng);

      // 🟢 起點 START
      if (!running && dStart < 20) {
        setStatus("起點觸發 START");
        startTimer();
      }

      // 🔴 終點 STOP
      if (running && dEnd < 20) {
        setStatus("終點觸發 STOP");
        stopTimer();
      }

      if (!running) {
        setStatus(`距起點 ${dStart.toFixed(1)}m / 終點 ${dEnd.toFixed(1)}m`);
      }
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>CCSPEED</h2>

      <button onClick={startGPS}>開始GPS</button>

      <h3>{status}</h3>

      <h1>{(elapsed / 1000).toFixed(2)} s</h1>

      {running && <p>🟢 計時中</p>}
    </div>
  );
}
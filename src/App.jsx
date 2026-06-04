import { useEffect, useState } from "react";

import { supabase } from "./supabase";

import RacePage from "./RacePage";
import AdminPage from "./AdminPage";

import HomePage from "./pages/HomePage";
import RaceSetupPage from "./pages/RaceSetupPage";
import LeaderboardHome from "./pages/LeaderboardHome";
import LeaderboardTrack from "./pages/LeaderboardTrack";
import LeaderboardResults from "./pages/LeaderboardResults";
import LeaderboardGroup from "./pages/LeaderboardGroup";

export default function App() {
  const [page, setPage] = useState("home");

  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [leaderboardTrack, setLeaderboardTrack] = useState(null);
  const [leaderboardDirection, setLeaderboardDirection] = useState(null);
  const [leaderboardVehicleGroup, setLeaderboardVehicleGroup] = useState(null);
  const [nickname, setNickname] = useState("");
  const [vehicleType, setVehicleType] = useState("速克達");
  const [vehicleModel, setVehicleModel] = useState("");

  const path = window.location.pathname;

  useEffect(() => {
    async function loadTracks() {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("賽道讀取失敗", error);
        alert("賽道讀取失敗：" + error.message);
        return;
      }

      setTracks(data || []);

      if (data && data.length > 0) {
        setSelectedTrack(data[0]);
      }
    }

    loadTracks();
  }, []);

  if (path === "/ccspeed-control-7281") {
    return <AdminPage />;
  }

  if (page === "home") {
    return (
      <HomePage
        onStartRace={() => setPage("setup")}
        onLeaderboard={() => setPage("leaderboard")}
      />
    );
  }

  if (page === "setup") {
    return (
      <RaceSetupPage
        tracks={tracks}
        selectedTrack={selectedTrack}
        setSelectedTrack={setSelectedTrack}
        nickname={nickname}
        setNickname={setNickname}
        vehicleType={vehicleType}
        setVehicleType={setVehicleType}
        vehicleModel={vehicleModel}
        setVehicleModel={setVehicleModel}
        onBack={() => setPage("home")}
        onStart={() => {
          if (!selectedTrack) {
            alert("請選擇賽道");
            return;
          }

          if (!nickname) {
            alert("請輸入暱稱");
            return;
          }

          if (!vehicleModel) {
            alert("請輸入車款");
            return;
          }

          setPage("race");
        }}
      />
    );
  }

  if (page === "race") {
    return (
      <RacePage
        nickname={nickname}
        vehicleType={vehicleType}
        vehicleModel={vehicleModel}
        track={selectedTrack}
      />
    );
  }

  if (page === "leaderboard") {
  return (
    <LeaderboardHome
      tracks={tracks}
      onBack={() => setPage("home")}
      onSelectTrack={(track) => {
        setLeaderboardTrack(track);
        setPage("leaderboardTrack");
      }}
    />
  );
}

if (page === "leaderboardTrack") {
  return (
    <LeaderboardTrack
      track={leaderboardTrack}
      onBack={() => setPage("leaderboard")}
      onSelectDirection={(direction) => {
        setLeaderboardDirection(direction);
        setPage("leaderboardGroup");
      }}
    />
  );
}

if (page === "leaderboardGroup") {
  return (
    <LeaderboardGroup
      track={leaderboardTrack}
      direction={leaderboardDirection}
      onBack={() => setPage("leaderboardTrack")}
      onSelectGroup={(group) => {
        setLeaderboardVehicleGroup(group);
        setPage("leaderboardResults");
      }}
    />
  );
}

if (page === "leaderboardResults") {
  return (
    <LeaderboardResults
      track={leaderboardTrack}
      direction={leaderboardDirection}
      vehicleGroup={leaderboardVehicleGroup}
      onBack={() => setPage("leaderboardGroup")}
    />
  );
}

  return null;
}
import { useEffect, useState } from "react";

import { supabase } from "./supabase";

import RacePage from "./RacePage";
import AdminPage from "./AdminPage";

import HomePage from "./pages/HomePage";
import RaceSetupPage from "./pages/RaceSetupPage";
import LeaderboardHome from "./pages/LeaderboardHome";
import LeaderboardTrack from "./pages/LeaderboardTrack";
import LeaderboardGroup from "./pages/LeaderboardGroup";
import LeaderboardResults from "./pages/LeaderboardResults";
import ResultPage from "./pages/ResultPage";

export default function App() {
  const [page, setPage] = useState("home");

  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const [leaderboardTrack, setLeaderboardTrack] = useState(null);
  const [leaderboardDirection, setLeaderboardDirection] = useState(null);
  const [leaderboardVehicleGroup, setLeaderboardVehicleGroup] = useState(null);

  const [vehicleType, setVehicleType] = useState("速克達");
  const [raceResult, setRaceResult] = useState(null);

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
        onLeaderboard={() => {
          setLeaderboardTrack(null);
          setLeaderboardDirection(null);
          setLeaderboardVehicleGroup(null);
          setPage("leaderboard");
        }}
      />
    );
  }

  if (page === "setup") {
    return (
      <RaceSetupPage
        tracks={tracks}
        selectedTrack={selectedTrack}
        setSelectedTrack={setSelectedTrack}
        vehicleType={vehicleType}
        setVehicleType={setVehicleType}
        onBack={() => setPage("home")}
        onStart={() => {
          if (!selectedTrack) {
            alert("請選擇賽道");
            return;
          }

          setRaceResult(null);
          setPage("race");
        }}
      />
    );
  }

  if (page === "race") {
    return (
      <RacePage
        vehicleType={vehicleType}
        track={selectedTrack}
        onBack={() => setPage("home")}
        onFinish={(result) => {
          setRaceResult(result);
          setPage("result");
        }}
      />
    );
  }


  if (page === "result") {
    return (
      <ResultPage
        result={raceResult}
        onBackHome={() => setPage("home")}
        onRaceAgain={() => {
          setRaceResult(null);
          setPage("setup");
        }}
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
          setLeaderboardDirection(null);
          setLeaderboardVehicleGroup(null);
          setPage("leaderboardTrack");
        }}
      />
    );
  }

  if (page === "leaderboardTrack") {
    if (!leaderboardTrack) {
      return (
        <LeaderboardHome
          tracks={tracks}
          onBack={() => setPage("home")}
          onSelectTrack={(track) => {
            setLeaderboardTrack(track);
            setLeaderboardDirection(null);
            setLeaderboardVehicleGroup(null);
            setPage("leaderboardTrack");
          }}
        />
      );
    }

    return (
      <LeaderboardTrack
        track={leaderboardTrack}
        onBack={() => setPage("leaderboard")}
        onSelectDirection={(direction) => {
          setLeaderboardDirection(direction);
          setLeaderboardVehicleGroup(null);
          setPage("leaderboardGroup");
        }}
      />
    );
  }

  if (page === "leaderboardGroup") {
    if (!leaderboardTrack || !leaderboardDirection) {
      return (
        <LeaderboardHome
          tracks={tracks}
          onBack={() => setPage("home")}
          onSelectTrack={(track) => {
            setLeaderboardTrack(track);
            setLeaderboardDirection(null);
            setLeaderboardVehicleGroup(null);
            setPage("leaderboardTrack");
          }}
        />
      );
    }

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
    if (!leaderboardTrack || !leaderboardDirection || !leaderboardVehicleGroup) {
      return (
        <LeaderboardHome
          tracks={tracks}
          onBack={() => setPage("home")}
          onSelectTrack={(track) => {
            setLeaderboardTrack(track);
            setLeaderboardDirection(null);
            setLeaderboardVehicleGroup(null);
            setPage("leaderboardTrack");
          }}
        />
      );
    }

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
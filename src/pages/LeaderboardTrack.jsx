export default function LeaderboardTrack({
  track,
  onBack,
  onSelectDirection,
}) {
  const trackName = track?.name || "";

  const parts = trackName.split("-");

  const pointA = parts[0]?.trim() || "起點";
  const pointB = parts[1]?.trim() || "終點";

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        padding: 20,
      }}
    >
      <h1>🏁 {trackName}</h1>

      <button
        onClick={onBack}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 20,
        }}
      >
        返回賽道列表
      </button>

      <button
        onClick={() =>
          onSelectDirection(`${pointA}→${pointB}`)
        }
        style={{
          width: "100%",
          padding: 20,
          marginBottom: 16,
          fontSize: 24,
        }}
      >
        {pointA} → {pointB}
      </button>

      <button
        onClick={() =>
          onSelectDirection(`${pointB}→${pointA}`)
        }
        style={{
          width: "100%",
          padding: 20,
          fontSize: 24,
        }}
      >
        {pointB} → {pointA}
      </button>
    </div>
  );
}
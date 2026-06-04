export default function LeaderboardTrack({
  track,
  onBack,
  onSelectDirection,
}) {
  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        padding: 20,
      }}
    >
      <h1>🏁 {track?.name}</h1>

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
        onClick={() => onSelectDirection("楠西→大埔")}
        style={{
          width: "100%",
          padding: 16,
          marginBottom: 12,
          fontSize: 18,
        }}
      >
        楠西 → 大埔
      </button>

      <button
        onClick={() => onSelectDirection("大埔→楠西")}
        style={{
          width: "100%",
          padding: 16,
          fontSize: 18,
        }}
      >
        大埔 → 楠西
      </button>
    </div>
  );
}
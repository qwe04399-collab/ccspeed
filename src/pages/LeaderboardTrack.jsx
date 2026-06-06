export default function LeaderboardTrack({
  track,
  onBack,
  onSelectDirection,
}) {
  const trackName = track?.name || "未命名賽道";
  const startName = track?.start_name?.trim() || "起點";
  const finishName = track?.finish_name?.trim() || "終點";

  const forwardDirection = `${startName}→${finishName}`;
  const reverseDirection = `${finishName}→${startName}`;

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
        onClick={() => onSelectDirection(forwardDirection)}
        style={{
          width: "100%",
          padding: 20,
          marginBottom: 16,
          fontSize: 24,
        }}
      >
        {startName} → {finishName}
      </button>

      <button
        onClick={() => onSelectDirection(reverseDirection)}
        style={{
          width: "100%",
          padding: 20,
          fontSize: 24,
        }}
      >
        {finishName} → {startName}
      </button>
    </div>
  );
}

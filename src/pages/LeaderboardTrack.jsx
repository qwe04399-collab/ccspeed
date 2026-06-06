export default function LeaderboardTrack({
  track,
  onBack,
  onSelectDirection,
}) {
  const trackName = track?.name || "未命名賽道";

  // ✅ 方向名稱一定使用資料庫的起點名稱 / 終點名稱
  // 不再用 track.name 拆字串，避免出現：上班買早餐 → 終點
  const pointA = track?.start_name?.trim() || "起點";
  const pointB = track?.finish_name?.trim() || "終點";

  const forwardDirection = `${pointA}→${pointB}`;
  const reverseDirection = `${pointB}→${pointA}`;

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
        {pointA} → {pointB}
      </button>

      <button
        onClick={() => onSelectDirection(reverseDirection)}
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

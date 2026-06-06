export default function LeaderboardGroup({
  track,
  direction,
  onBack,
  onSelectGroup,
}) {
  const groups = [
    { key: "速克達", title: "🛵 速克達組" },
    { key: "檔車", title: "🏍 檔車組" },
    { key: "汽車", title: "🚗 汽車組" },
  ];

  const startName = track?.start_name?.trim() || "起點";
  const finishName = track?.finish_name?.trim() || "終點";

  // ✅ 如果舊資料還傳到「賽道名稱→終點」，這裡直接修正顯示
  const displayDirection =
    direction === `${track?.name}→終點`
      ? `${startName}→${finishName}`
      : direction === `終點→${track?.name}`
      ? `${finishName}→${startName}`
      : direction;

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h1>🏆 排行榜</h1>

      <h2>{track?.name}</h2>
      <p>方向：{displayDirection}</p>

      <button
        onClick={onBack}
        style={{ width: "100%", padding: 12, marginBottom: 20 }}
      >
        返回方向選擇
      </button>

      {groups.map((group) => (
        <button
          key={group.key}
          onClick={() => onSelectGroup(group.key)}
          style={{
            width: "100%",
            padding: 16,
            marginBottom: 12,
            fontSize: 18,
          }}
        >
          {group.title}
        </button>
      ))}
    </div>
  );
}

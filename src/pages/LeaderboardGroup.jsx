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

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h1>🏆 排行榜</h1>

      <h2>{track?.name}</h2>
      <p>方向：{direction}</p>

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
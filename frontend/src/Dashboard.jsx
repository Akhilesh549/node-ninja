import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Dashboard() {
  const stats = {
    total: 120,
    plastic: 40,
    organic: 30,
    metal: 20,
    glass: 15,
    paper: 15,
  };

  const data = [
    { name: "Plastic", value: stats.plastic },
    { name: "Organic", value: stats.organic },
    { name: "Metal", value: stats.metal },
    { name: "Glass", value: stats.glass },
    { name: "Paper", value: stats.paper },
  ];

  const colors = ["#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444"];

  const history = [
    { category: "Plastic", confidence: "92%", time: "10:30 AM" },
    { category: "Organic", confidence: "88%", time: "11:00 AM" },
    { category: "Metal", confidence: "85%", time: "11:20 AM" },
    { category: "Glass", confidence: "90%", time: "11:45 AM" },
    { category: "Paper", confidence: "87%", time: "12:10 PM" },
  ];

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    textAlign: "center",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Waste Segregation Dashboard
      </h1>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <h3>Total</h3>
          <p>{stats.total}</p>
        </div>
        <div style={cardStyle}>
          <h3>Plastic</h3>
          <p>{stats.plastic}</p>
        </div>
        <div style={cardStyle}>
          <h3>Organic</h3>
          <p>{stats.organic}</p>
        </div>
        <div style={cardStyle}>
          <h3>Metal</h3>
          <p>{stats.metal}</p>
        </div>
        <div style={cardStyle}>
          <h3>Glass</h3>
          <p>{stats.glass}</p>
        </div>
        <div style={cardStyle}>
          <h3>Paper</h3>
          <p>{stats.paper}</p>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Category Breakdown</h2>

        <div style={{ width: "100%", height: "320px" }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                outerRadius={110}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent History */}
      <div
        style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Recent Classifications</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Category</th>
              <th align="left">Confidence</th>
              <th align="left">Time</th>
            </tr>
          </thead>

          <tbody>
            {history.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "10px 0" }}>{item.category}</td>
                <td>{item.confidence}</td>
                <td>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
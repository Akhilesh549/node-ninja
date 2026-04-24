function Dashboard() {
  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Waste Segregation Dashboard</h1>
      <h2>Total Items: 120</h2>

      <div>
        <p>Plastic: 40</p>
        <p>Organic: 30</p>
        <p>Metal: 20</p>
        <p>Glass: 15</p>
        <p>Paper: 15</p>
      </div>

      <h3>Recent History</h3>
      <ul>
        <li>Plastic - 92%</li>
        <li>Organic - 88%</li>
        <li>Metal - 84%</li>
      </ul>
    </div>
  );
}

export default Dashboard;
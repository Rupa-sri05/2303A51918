const axios = require('axios');
const Log = require('../middleware/logger');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMzAzYTUxOTE4QHNydS5lZHUuaW4iLCJleHAiOjE3ODE3NjYwMzksImlhdCI6MTc4MTc2NTEzOSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjJiMmUzOTFjLWNkNTAtNGFiZS05NjUwLWFjYTQ2OTM0NTE5NiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJ1ZHJvanUgcnVwYSBzcmkiLCJzdWIiOiI1ZTVkNTUwZC02NDAyLTRlYjYtYjNlZC03NTIzZGY1YmFkZWYifSwiZW1haWwiOiIyMzAzYTUxOTE4QHNydS5lZHUuaW4iLCJuYW1lIjoicnVkcm9qdSBydXBhIHNyaSIsInJvbGxObyI6IjIzMDNhNTE5MTgiLCJhY2Nlc3NDb2RlIjoiYkRyZUFxIiwiY2xpZW50SUQiOiI1ZTVkNTUwZC02NDAyLTRlYjYtYjNlZC03NTIzZGY1YmFkZWYiLCJjbGllbnRTZWNyZXQiOiJ2Q1NiRkhBRVJxZ05qUXRUIn0.E608uIKBG5LgRyEudCBZu8OvUjsFnOHnzzEHLKvtUQY";

const headers = { Authorization: `Bearer ${TOKEN}` };

async function solve() {
  await Log('backend', 'info', 'service', 'Starting vehicle scheduling solution');

  await Log('backend', 'info', 'service', 'Fetching depots from API');
  const { data: depotData } = await axios.get(
    'http://4.224.186.213/evaluation-service/depots', { headers }
  );

  await Log('backend', 'info', 'service', 'Fetching vehicles from API');
  const { data: vehicleData } = await axios.get(
    'http://4.224.186.213/evaluation-service/vehicles', { headers }
  );

  const depots = depotData.depots;
  const vehicles = vehicleData.vehicles;

  await Log('backend', 'info', 'service', `Fetched ${depots.length} depots and ${vehicles.length} vehicles`);

  const results = [];

  for (const depot of depots) {
    const capacity = depot.MechanicHours;
    const dp = Array(capacity + 1).fill(0);

    for (const v of vehicles) {
      for (let w = capacity; w >= v.Duration; w--) {
        dp[w] = Math.max(dp[w], dp[w - v.Duration] + v.Impact);
      }
    }

    await Log('backend', 'info', 'service', `Depot ${depot.ID}: MaxImpact=${dp[capacity]} within ${capacity} hours`);

    results.push({
      depotID: depot.ID,
      mechanicHours: capacity,
      maxImpact: dp[capacity]
    });

    console.log(`Depot ${depot.ID} | Hours: ${capacity} | Max Impact: ${dp[capacity]}`);
  }

  console.log('\n✅ All depots processed!');
  console.log(JSON.stringify(results, null, 2));
}

solve().catch(async (err) => {
  await Log('backend', 'error', 'service', `Error: ${err.message}`);
  console.error(err);
});
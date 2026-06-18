const axios = require('axios');
const Log = require('./middleware/logger');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMzAzYTUxOTE4QHNydS5lZHUuaW4iLCJleHAiOjE3ODE3NjYwMzksImlhdCI6MTc4MTc2NTEzOSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjJiMmUzOTFjLWNkNTAtNGFiZS05NjUwLWFjYTQ2OTM0NTE5NiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJ1ZHJvanUgcnVwYSBzcmkiLCJzdWIiOiI1ZTVkNTUwZC02NDAyLTRlYjYtYjNlZC03NTIzZGY1YmFkZWYifSwiZW1haWwiOiIyMzAzYTUxOTE4QHNydS5lZHUuaW4iLCJuYW1lIjoicnVkcm9qdSBydXBhIHNyaSIsInJvbGxObyI6IjIzMDNhNTE5MTgiLCJhY2Nlc3NDb2RlIjoiYkRyZUFxIiwiY2xpZW50SUQiOiI1ZTVkNTUwZC02NDAyLTRlYjYtYjNlZC03NTIzZGY1YmFkZWYiLCJjbGllbnRTZWNyZXQiOiJ2Q1NiRkhBRVJxZ05qUXRUIn0.E608uIKBG5LgRyEudCBZu8OvUjsFnOHnzzEHLKvtUQY";

const headers = { Authorization: `Bearer ${TOKEN}` };

const WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

async function getPriorityInbox(topN = 10) {
  await Log('backend', 'info', 'service', 'Fetching notifications from API');

  const { data } = await axios.get(
    'http://4.224.186.213/evaluation-service/notifications',
    { headers }
  );

  const notifications = data.notifications;
  await Log('backend', 'info', 'service', `Fetched ${notifications.length} notifications`);

  const scored = notifications.map(n => ({
    ...n,
    score: (WEIGHTS[n.Type] || 0) * 1000000000000 + new Date(n.Timestamp).getTime()
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topN);

  await Log('backend', 'info', 'service', `Top ${topN} priority notifications selected`);

  console.log(`\n🔔 Top ${topN} Priority Notifications:\n`);
  top.forEach((n, i) => {
    console.log(`${i + 1}. [${n.Type}] ${n.Message} - ${n.Timestamp}`);
  });

  console.log('\n📋 Full JSON:');
  console.log(JSON.stringify(top, null, 2));
}

getPriorityInbox(10).catch(async (err) => {
  await Log('backend', 'error', 'service', `Error: ${err.message}`);
  console.error(err);
});
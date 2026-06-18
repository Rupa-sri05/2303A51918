const axios = require('axios');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMzAzYTUxOTE4QHNydS5lZHUuaW4iLCJleHAiOjE3ODE3NjYwMzksImlhdCI6MTc4MTc2NTEzOSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjJiMmUzOTFjLWNkNTAtNGFiZS05NjUwLWFjYTQ2OTM0NTE5NiIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InJ1ZHJvanUgcnVwYSBzcmkiLCJzdWIiOiI1ZTVkNTUwZC02NDAyLTRlYjYtYjNlZC03NTIzZGY1YmFkZWYifSwiZW1haWwiOiIyMzAzYTUxOTE4QHNydS5lZHUuaW4iLCJuYW1lIjoicnVkcm9qdSBydXBhIHNyaSIsInJvbGxObyI6IjIzMDNhNTE5MTgiLCJhY2Nlc3NDb2RlIjoiYkRyZUFxIiwiY2xpZW50SUQiOiI1ZTVkNTUwZC02NDAyLTRlYjYtYjNlZC03NTIzZGY1YmFkZWYiLCJjbGllbnRTZWNyZXQiOiJ2Q1NiRkhBRVJxZ05qUXRUIn0.E608uIKBG5LgRyEudCBZu8OvUjsFnOHnzzEHLKvtUQY";

async function Log(stack, level, package_, message) {
  try {
    await axios.post(
      'http://4.224.186.213/evaluation-service/logs',
      {
        stack: stack,
        level: level,
        package: package_,
        message: message
      },
      {
        headers: { Authorization: `Bearer ${TOKEN}` }
      }
    );
  } catch (err) {
    console.error('Logging failed:', err.message);
  }
}

module.exports = Log;
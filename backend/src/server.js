const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.warn('⚠️ Starting Express server with offline database. Endpoints requiring database will await MongoDB or return 500 until MongoDB is active.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MediKiosk Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  });
}

startServer();

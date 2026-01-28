const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hadirin_db',
  charset: 'utf8'
};

let connection;

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to database...');
    console.log('📍 Host:', dbConfig.host);
    console.log('👤 User:', dbConfig.user);
    console.log('🗄️  Database:', dbConfig.database);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully to hadirin_db');
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 SOLUTION: Make sure XAMPP MySQL is running!');
      console.error('1. Open XAMPP Control Panel');
      console.error('2. Start MySQL service');
      console.error('3. Make sure database "hadirin_db" exists\n');
    }
    
    // Don't exit in development, just log the error
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
    throw error;
  }
};

const getConnection = () => {
  if (!connection) {
    throw new Error('Database not connected');
  }
  return connection;
};

module.exports = { connectDB, getConnection };
// src/lib/db.ts

import mysql from 'mysql2/promise';

// Creamos un "pool" de conexiones.
// Esto es más eficiente que crear una conexión por cada consulta.
// La librería gestiona las conexiones abiertas por nosotros.
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,       // 'db' (el nombre del servicio en docker-compose)
  user: process.env.DATABASE_USER,       // 'annyamodas_user'
  password: process.env.DATABASE_PASSWORD, // la contraseña que pusiste
  database: process.env.DATABASE_NAME,   // 'annyamodas_db'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificamos la conexión al iniciar la aplicación.
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a la base de datos MySQL!');
    connection.release(); // Liberamos la conexión de vuelta al pool
  })
  .catch(error => {
    console.error('❌ Error al conectar a la base de datos:', error);
  });

export default pool;

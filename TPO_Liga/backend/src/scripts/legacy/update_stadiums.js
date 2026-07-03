require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false 
  }
};

const stadiums = [
  { name: 'Atenas (Córdoba)', stadium: 'Estadio Estructuras Pretensa Atenas' },
  { name: 'Argentino (Junín)', stadium: 'El Fortín de las Morochas' },
  { name: 'Boca Juniors', stadium: 'Estadio Luis Conde (La Bombonerita)' },
  { name: 'Ferro Carril Oeste', stadium: 'Estadio Héctor Etchart' },
  { name: 'Gimnasia (Comodoro Rivadavia)', stadium: 'Estadio Socios Fundadores' },
  { name: 'Independiente (Oliva)', stadium: 'El Gigante' },
  { name: 'Instituto (Córdoba)', stadium: 'Estadio Ángel Sandrín' },
  { name: 'La Unión (Formosa)', stadium: 'Estadio Cincuentenario' },
  { name: 'Oberá Tenis Club', stadium: 'Estadio Dr. Luis Augusto Derna' },
  { name: 'Obras Sanitarias', stadium: 'Templo del Rock' },
  { name: 'Olímpico (La Banda)', stadium: 'Estadio Vicente Rosales' },
  { name: 'Peñarol (Mar del Plata)', stadium: 'Polideportivo Islas Malvinas' },
  { name: 'Platense', stadium: 'Microestadio Ciudad de Vicente López' },
  { name: 'Quimsa (Santiago del Estero)', stadium: 'Estadio Ciudad' },
  { name: 'Regatas (Corrientes)', stadium: 'Estadio José Jorge Contte' },
  { name: 'Riachuelo (La Rioja)', stadium: 'Superdomo La Rioja' },
  { name: 'San Lorenzo', stadium: 'Polideportivo Roberto Pando' },
  { name: 'San Martín (Corrientes)', stadium: 'El Fortín Rojinegro' },
  { name: 'Unión (Santa Fe)', stadium: 'Estadio Ángel P. Malvicino' },
  { name: 'Zárate Basket', stadium: 'D.A.M. Stadium' }
];

async function updateStadiums() {
  try {
    let pool = await sql.connect(config);
    
    // 1. Agregar columna StadiumName a Teams si no existe
    try {
      console.log("Agregando columna StadiumName...");
      await pool.request().query("ALTER TABLE Teams ADD StadiumName VARCHAR(150) NULL");
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicado')) {
        console.log("La columna StadiumName ya existe.");
      } else {
        console.error("No se pudo agregar columna:", err.message);
      }
    }

    // 2. Actualizar los estadios de los equipos
    console.log("Actualizando estadios...");
    let updatedCount = 0;
    for (const team of stadiums) {
      const result = await pool.request()
        .input('Name', sql.NVarChar, team.name)
        .input('Stadium', sql.NVarChar, team.stadium)
        .query('UPDATE Teams SET StadiumName = @Stadium WHERE Name = @Name');
      
      if (result.rowsAffected[0] > 0) {
        updatedCount++;
      } else {
        console.log(`Equipo no encontrado: ${team.name}`);
      }
    }

    console.log(`¡Proceso finalizado! Se actualizaron ${updatedCount} estadios.`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit();
  }
}

updateStadiums();

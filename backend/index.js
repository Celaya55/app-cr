require('dotenv').config();
const express = require('express'); // El framework para crear el servidor
const { PrismaClient } = require('@prisma/client'); // El cliente para hablar con la DB
const cors = require('cors'); // Permite que el Frontend se conecte al Backend
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para manejar la seguridad (tokens)

const prisma = new PrismaClient();

const app = express();
const TOKEN = process.env.JWT_SECRET;// Una clave para firmar tus tokens
// Agrega esta línea
const PORT = process.env.PORT || 3000; 



// Middlewares: Funciones que procesan la info antes de llegar a las rutas
app.use(cors()); 
app.use(express.json()); // Permite que tu servidor entienda archivos JSON
app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});

app.post('/usuarios', async (req, res) => {
  try {
    // Basicamente aqui jalo el email y el password para despues hashaer la password
    // OJO: Se debe hashear antes de el 'prisma.user.create'
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.user.create({
      data: {
        email: req.body.email,
        // Aqui en lugar de pasarle el valor: req.body.password, se le pasa el valor que definimos arriba hashedPassword
        password: hashedPassword
      }
    });
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.log("DETALLE DEL ERROR:", error); // Esto te dirá exactamente qué falló en la terminal
    res.status(500).json({ error: "Error al insertar en Postgres" });
  }
});
app.get('/usuarios', async (req, res) => {
  try{
    const consultaUsuario= await prisma.user.findMany({
      select: {
        id: true,
        email: true, 
        tasks: true
    }});
    res.status(200).json(consultaUsuario);
  }catch(error){
    console.log("DETALLE DEL ERROR:", error); // Esto te dirá exactamente qué falló en la terminal
    res.status(500).json({ error: "Error al consultar registros en Postgres" });
  }
});
// Nota: No puedes borrar un usuario si tiene tareas asociadas, primero debes borrar las tareas
//  o eliminar la relación entre el usuario y las tareas antes de intentar eliminar el usuario. 
app.delete('/usuarios/:id', async (req, res) => {
  try{
    const borrarUsuario= await prisma.user.delete({
      where: {
        id: parseInt(req.params.id)
      }
    })
    res.status(200).json({ message: `Usuario con ID ${req.params.id} eliminado exitosamente.` });
  }catch(error){
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: `El usuario con ID ${req.params.id} no existe en la base de datos.` 
      });
    }
    console.log("DETALLE DEL ERROR:", error); // Esto te dirá exactamente qué falló en la terminal
    res.status(500).json({ error: "Error al intentar eliminar registros en Postgres" });
  }
});
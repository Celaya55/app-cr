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
//midleware para verificar el token en las rutas protegidas

const authenticateToken = (req, res, next) => {
  // 1. Buscamos el token en los headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Separamos "Bearer" del token

  if (!token) {
    return res.status(401).json({ error: "Nse pro oporcionó un token de acceso" });
  }

  // 2. Verificamos que el token sea válido con nuestro SECRET del .env
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido o expirado" });
    }
    
    // Si es válido, guardamos los datos del usuario en el request
    req.user = decoded;
    next(); // Saltamos a la función de la ruta
  });
};

app.post('/usuarios', authenticateToken, async (req, res) => {
  try {
    // Nota: Basicamente aqui jalo el email y el password para despues hashaer la password
    // OJO: Se debe hashear antes de el 'prisma.user.create'
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.user.create({
      data: {
        email: req.body.email,
        // Nota: Aqui en lugar de pasarle el valor: req.body.password, se le pasa el valor que definimos arriba hashedPassword
        password: hashedPassword
      }
    });
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.log("DETALLE DEL ERROR:", error); // Esto te dirá exactamente qué falló en la terminal
    res.status(500).json({ error: "Error al insertar en Postgres" });
  }
});

app.get('/usuarios', authenticateToken, async (req, res) => {
  try{
    const consultaUsuario = await prisma.user.findMany({
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
app.delete('/usuarios/:id', authenticateToken,async (req, res) => {
  try{
    const borrarUsuario = await prisma.user.delete({
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

app.patch('/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { email, password } = req.body;
    const data = {};
    if (email) {
      data.email = email;
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      data.password = hashedPassword;
    }
    // Corroborar que al menos exista un campo para actualizar
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "Debe proporcionar al menos un campo para actualizar."
      });
    }
    // Actualizar usuario
    const usuarioActualizado = await prisma.user.update({
      where: { id: id },
      data: data
    });
    res.status(200).json(usuarioActualizado);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: `El usuario con ID ${req.params.id} no existe en la base de datos.`
      });
    }
    console.log("DETALLE DEL ERROR:", error);
    res.status(500).json({ error: "Error al actualizar usuario en Postgres" });
  }
});

// Ruta para el login con JWT
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // 1. Buscar al usuario en Postgres con Prisma
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "Usuario no encontrado" });
  }

  // 2. Verificar la contraseña (asumiendo que la guardaste encriptada)
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  // 3. Crear el token usando tu secreto del .env
  const token = jwt.sign(
    { userId: user.id, email: user.email }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' } // El token expira en 1 hora
  );

  res.json({ token });
});
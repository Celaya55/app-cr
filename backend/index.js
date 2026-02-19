const express = require('express'); // El framework para crear el servidor
const { PrismaClient } = require('@prisma/client'); // El cliente para hablar con la DB
const cors = require('cors'); // Permite que el Frontend se conecte al Backend
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para manejar la seguridad (tokens)

const prisma = new PrismaClient();
const app = express();
const Token = process.env.JWT_SECRET;// Una clave para firmar tus tokens

// Middlewares: Funciones que procesan la info antes de llegar a las rutas
app.use(cors()); 
app.use(express.json()); // Permite que tu servidor entienda archivos JSON
// middleware/uploadMiddleware.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Usamos las variables de Render / .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Guardamos en memoria RAM de forma temporal para no saturar disco
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Función para subir a Cloudinary desde memoria
const subirACloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'vehiculos' }, // Se guardan en una carpeta llamada 'vehiculos' en Cloudinary
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Devuelve la URL HTTPS pública
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = { upload, subirACloudinary };
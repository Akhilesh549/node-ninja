const fs = require('fs');
const {
  database,
  ref,
  push,
  set,
  storage,
  storageRef,
  uploadBytes,
  getDownloadURL,
  isFirebaseConfigured
} = require('../config/firebase');

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required (field name: image).' });
    }

    if (!isFirebaseConfigured()) {
      return res.status(503).json({
        error: 'Firebase is not configured. Set real credentials in the backend .env file.'
      });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${req.file.originalname}`;
    const imageRef = storageRef(storage, `images/${filename}`);
    
    const fileBuffer = fs.readFileSync(req.file.path);
    
    await uploadBytes(imageRef, fileBuffer, {
      contentType: req.file.mimetype || 'image/jpeg'
    });
    
    const downloadURL = await getDownloadURL(imageRef);
    const uploadsRef = ref(database, 'uploads');
    const uploadRef = push(uploadsRef);
    const uploadRecord = {
      filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `images/${filename}`,
      url: downloadURL,
      createdAt: new Date().toISOString()
    };

    await set(uploadRef, uploadRecord);
    
    return res.status(200).json({
      success: true,
      id: uploadRef.key,
      url: downloadURL,
      filename,
      path: `images/${filename}`
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return next(error);
  }
};

module.exports = { uploadImage };

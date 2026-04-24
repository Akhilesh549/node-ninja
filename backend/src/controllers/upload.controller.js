const { storage, storageRef, uploadBytes, getDownloadURL } = require('../config/firebase');
const path = require('path');

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required (field name: image).' });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${req.file.originalname}`;
    const imageRef = storageRef(storage, `images/${filename}`);
    
    // Read the file and upload to Firebase Storage
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(req.file.path);
    
    await uploadBytes(imageRef, fileBuffer, {
      contentType: req.file.mimetype || 'image/jpeg'
    });
    
    const downloadURL = await getDownloadURL(imageRef);
    
    return res.status(200).json({
      success: true,
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
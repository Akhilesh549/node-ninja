const multer = require('multer');
const path = require('path');

const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }

    return cb(new Error('Only image files are allowed.'));
  }
});

const uploadSingleImage = upload.single('image');

module.exports = { uploadSingleImage };
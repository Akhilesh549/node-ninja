const { readFile } = require('node:fs/promises');

const predictWithMlService = async ({ filePath, originalName, mimetype, mlServiceUrl }) => {
  const imageBytes = await readFile(filePath);
  const form = new FormData();
  const blob = new Blob([imageBytes], { type: mimetype || 'image/jpeg' });

  form.append('image', blob, originalName || 'upload.jpg');

  const response = await fetch(`${mlServiceUrl}/predict`, {
    method: 'POST',
    body: form
  });

  if (!response.ok) {
    throw new Error(`ML service failed with status ${response.status}`);
  }

  return response.json();
};

module.exports = { predictWithMlService };

const sharp = require('sharp');
const { v2: cloudinary } = require('cloudinary');

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  configured = true;
}

// Resize/compress to WebP, then stream-upload to Cloudinary.
// Returns { url, publicId } so the caller can persist both for later replace/delete.
async function uploadProductImage(buffer) {
  ensureConfigured();
  const webpBuffer = await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sugam/products', resource_type: 'image', format: 'webp' },
      (error, res) => (error ? reject(error) : resolve(res))
    );
    stream.end(webpBuffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

// Delete an asset by its Cloudinary public_id. Best-effort: never throws.
async function deleteProductImage(publicId) {
  if (!publicId) return;
  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.error('Cloudinary delete failed:', err.message);
  }
}

module.exports = { uploadProductImage, deleteProductImage };

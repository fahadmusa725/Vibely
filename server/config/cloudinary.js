const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadStream = (buffer, folder = 'vibely') => {
  return new Promise((resolve, reject) => {
    const hasValidCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'demo' &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY !== '123456789012345';

    if (hasValidCloudinary) {
      const cldStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          } else {
            reject(error);
          }
        }
      );
      Readable.from(buffer).pipe(cldStream);
    } else {
      const base64Data = buffer.toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64Data}`;
      resolve({
        url: dataUri,
        public_id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      });
    }
  });
};

module.exports = {
  cloudinary,
  uploadStream,
};

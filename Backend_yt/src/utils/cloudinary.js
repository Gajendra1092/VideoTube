import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'; // nodejs library which is used in file handling like read file, write, remove or change permissions etc.

 // Configuration
 cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Force HTTPS URLs
});

// method to upload file.
const uploadOnCloudinary = async (localFilePath) => {
    try{
         if(!localFilePath) {
            console.log('❌ No local file path provided to uploadOnCloudinary');
            return null;
         }

         // Normalize file path for cross-platform compatibility
         const normalizedPath = localFilePath.replace(/\\/g, '/');

         console.log('☁️ Starting Cloudinary upload for:', normalizedPath);
         console.log('☁️ Original path:', localFilePath);
         console.log('☁️ Cloudinary config check:', {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret_exists: !!process.env.CLOUDINARY_API_SECRET
         });

         // Check if file exists
         if (!fs.existsSync(localFilePath)) {
            console.error('❌ File does not exist at path:', localFilePath);
            return null;
         }

         //upload the file on cloudinary using normalized path
         const response = await cloudinary.uploader.upload(normalizedPath, {
            resource_type: 'auto',
            secure: true // Ensure HTTPS URL is returned
         })

         // file has been uploaded successfully.
         console.log('✅ File uploaded successfully to Cloudinary:', response.url);

         // Clean up local file after successful upload
         try {
            fs.unlinkSync(localFilePath);
            console.log('🗑️ Local temp file cleaned up:', localFilePath);
         } catch (cleanupError) {
            console.warn('⚠️ Failed to cleanup local file:', cleanupError.message);
         }

         return response;

    }
    catch(error){
        console.error('❌ Cloudinary upload failed:', {
            error: error.message,
            localFilePath,
            stack: error.stack
        });

        // Clean up local file even if upload failed
        try {
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
                console.log('🗑️ Local temp file cleaned up after error:', localFilePath);
            }
        } catch (cleanupError) {
            console.warn('⚠️ Failed to cleanup local file after error:', cleanupError.message);
        }

        return null;
    }
}

export {uploadOnCloudinary};

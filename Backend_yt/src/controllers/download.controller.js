import { Video } from "../models/video.models.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import fs from 'fs'
import path from 'path'

const getVideoDownloadInfo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required!")
    }

    const video = await Video.findById(videoId).select('title videoFile thumbnail duration')
    
    if (!video) {
        throw new ApiError(404, "Video not found!")
    }

    // In a real implementation, you might have multiple quality versions stored
    // For now, we'll provide the available formats based on the original video
    const downloadOptions = {
        video: {
            formats: [
                {
                    format: 'mp4',
                    quality: 'original',
                    url: video.videoFile,
                    size: 'Unknown', // You could calculate this from file metadata
                    description: 'Original quality'
                }
            ]
        },
        audio: {
            formats: [
                {
                    format: 'mp3',
                    quality: '128kbps',
                    url: video.videoFile, // In real implementation, this would be audio-only
                    size: 'Unknown',
                    description: 'Audio only'
                }
            ]
        },
        thumbnail: {
            url: video.thumbnail,
            format: 'jpg',
            description: 'Video thumbnail'
        }
    }

    res.status(200).json(
        new ApiResponse(200, {
            videoId: video._id,
            title: video.title,
            duration: video.duration,
            downloadOptions
        }, "Download options fetched successfully!")
    )
})

const downloadVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { format = 'mp4', quality = 'original' } = req.query
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required!")
    }

    const video = await Video.findById(videoId).select('title videoFile thumbnail')
    
    if (!video) {
        throw new ApiError(404, "Video not found!")
    }

    let downloadUrl
    let filename
    let contentType

    switch (format) {
        case 'mp4':
            downloadUrl = video.videoFile
            filename = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`
            contentType = 'video/mp4'
            break
        case 'mp3':
            // In a real implementation, you would convert video to audio
            downloadUrl = video.videoFile
            filename = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`
            contentType = 'audio/mpeg'
            break
        case 'thumbnail':
            downloadUrl = video.thumbnail
            filename = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}_thumbnail.jpg`
            contentType = 'image/jpeg'
            break
        default:
            throw new ApiError(400, "Invalid format specified!")
    }

    // For cloud-hosted files (like Cloudinary), we need to proxy the download
    if (downloadUrl.startsWith('http')) {
        try {
            // Use axios for better streaming support
            const axios = require('axios')

            // Fetch the file from the cloud URL with streaming
            const response = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream',
                timeout: 30000, // 30 second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })

            // Set headers to force download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.setHeader('Content-Type', contentType)
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

            // Set content length if available
            if (response.headers['content-length']) {
                res.setHeader('Content-Length', response.headers['content-length'])
            }

            // Handle errors during streaming
            response.data.on('error', (error) => {
                console.error('Stream error:', error)
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Download failed' })
                }
            })

            // Stream the file to the response
            response.data.pipe(res)
            return
        } catch (error) {
            console.error('Error downloading from cloud:', error)
            throw new ApiError(500, "Error downloading file from cloud storage!")
        }
    }

    // For local files, stream the file
    try {
        const filePath = path.resolve(downloadUrl)
        
        if (!fs.existsSync(filePath)) {
            throw new ApiError(404, "Video file not found on server!")
        }

        const stat = fs.statSync(filePath)
        const fileSize = stat.size

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Length', fileSize)

        const fileStream = fs.createReadStream(filePath)
        fileStream.pipe(res)
    } catch (error) {
        throw new ApiError(500, "Error downloading file: " + error.message)
    }
})

const getVideoFormats = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required!")
    }

    const video = await Video.findById(videoId).select('title videoFile thumbnail')
    
    if (!video) {
        throw new ApiError(404, "Video not found!")
    }

    // Available formats - in a real implementation, you might have multiple quality versions
    const formats = [
        {
            id: 'mp4-original',
            format: 'mp4',
            quality: 'original',
            type: 'video',
            name: 'MP4 Video (Original)',
            description: 'Best quality, larger file size',
            available: true,
            estimated_size: 'Unknown'
        },
        {
            id: 'mp3-128',
            format: 'mp3',
            quality: '128kbps',
            type: 'audio',
            name: 'MP3 Audio (128kbps)',
            description: 'Audio only, smaller file size',
            available: true,
            estimated_size: 'Unknown'
        },
        {
            id: 'thumbnail',
            format: 'jpg',
            quality: 'high',
            type: 'image',
            name: 'Thumbnail Image',
            description: 'Video thumbnail',
            available: !!video.thumbnail,
            estimated_size: 'Small'
        }
    ]

    res.status(200).json(
        new ApiResponse(200, {
            videoId: video._id,
            title: video.title,
            formats: formats.filter(f => f.available)
        }, "Video formats fetched successfully!")
    )
})

export {
    getVideoDownloadInfo,
    downloadVideo,
    getVideoFormats
}

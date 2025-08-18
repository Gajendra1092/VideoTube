import { ApiError } from "../utils/ApiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"

const optionalAuth = asyncHandler(async (req, res, next) => {
    try {
        // Extract token from cookies or Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            // No token provided, set user to null and continue
            req.user = null
            return next()
        }

        // Verify token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        // Find user
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        
        if (!user) {
            // Invalid token, set user to null and continue
            req.user = null
            return next()
        }

        // Set user and continue
        req.user = user
        next()
    } catch (error) {
        // Any error in authentication, set user to null and continue
        req.user = null
        next()
    }
})

export { optionalAuth }

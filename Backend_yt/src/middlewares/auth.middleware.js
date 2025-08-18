import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _ , next) => {

   try {
    console.log('🔐 Auth middleware - checking authentication');
    console.log('🍪 Cookies received:', req.cookies);
    console.log('📋 Headers received:', {
      authorization: req.header("Authorization"),
      cookie: req.header("Cookie")
    });

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    console.log('🎫 Token extracted:', token ? 'Token found' : 'No token');

    if(!token){
     console.log('❌ No token found in cookies or headers');
     throw new ApiError(401, "Unauthorized request");
    }
 
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
 
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
 
    if(!user){
     throw new ApiError(404, "Invalid access token!");
    }
    
    // adding new object to request.
    req.user = user;
    next();
    
   } 
   catch (error) {
    throw new ApiError(401, "Unauthorized request");
   }
})

// cookies access to req and response is given by cookie parser package in app.js.
// req.header is given by mobile applications.

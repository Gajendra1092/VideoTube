import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const { Schema } = mongoose;  
const UserSchema = new Schema(
    
    {
        username:{
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        email:{
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avatar:{
            type: String, // cloudinary url
            required: true,
        },
        
        coverImage:{
            type: String, // cloudinary url
        },

        // Channel About Section Fields
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ''
        },

        // Social Links
        socialLinks: {
            website: {
                type: String,
                trim: true,
                default: ''
            },
            twitter: {
                type: String,
                trim: true,
                default: ''
            },
            instagram: {
                type: String,
                trim: true,
                default: ''
            },
            facebook: {
                type: String,
                trim: true,
                default: ''
            },
            linkedin: {
                type: String,
                trim: true,
                default: ''
            },
            youtube: {
                type: String,
                trim: true,
                default: ''
            }
        },

        // Contact Information
        businessEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },

        location: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ''
        },

        // Channel Customization
        channelTrailer: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            default: null
        },

        // Channel Banner (different from cover image)
        channelBanner: {
            type: String, // cloudinary url
            default: ''
        },

        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type: String,
            // required: [true, 'Password is required'], // custom message field

        },

        googleId:{
            type: String,
            unique: true,
            sparse: true // allows multiple null values
        },
        googleId: { // helps in registering user with google auth
            type: String,
            unique: true,
            sparse: true // Ensures uniqueness but allows null values
        },

        // Privacy Settings
        profileVisibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'public'
        },
        showEmail: {
            type: Boolean,
            default: false
        },

        refreshToken:{
            type: String,
        }},
        {
            timestamps: true
        }

)
UserSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next()
})
// This will update the password evertime when the user even saves the other things. So, if condition is introduced.

// method to check for password
UserSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password) // await as crypto graphy takes time.
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname,
    },
      process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    
)
}

UserSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
    },
      process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User", UserSchema); // User is the name of the collection in the database. UserSchema is the schema of the collection.
// TEST DATA GENERATION SCRIPT - DO NOT COMMIT TO GIT
// This script generates realistic test data for performance testing

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../src/models/user.models.js';
import { Video } from '../src/models/video.models.js';
import { Like } from '../src/models/like.models.js';
import { Comment } from '../src/models/comment.models.js';
import { Subscription } from '../src/models/subscription.models.js';
import { VideoView } from '../src/models/videoView.models.js';
import { WatchHistory } from '../src/models/watchHistory.models.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample data arrays for realistic content generation
const sampleUsernames = [
    'TechGuru2024', 'CreativeMinds', 'AdventureSeeker', 'MusicLover99', 'CodingNinja',
    'ArtisticSoul', 'FitnessFreak', 'BookwormBella', 'GamerPro', 'FoodieFinder',
    'TravelBug', 'ScienceGeek', 'MovieBuff', 'NatureLover', 'PhotographyPro',
    'DanceMachine', 'ChefMaster', 'PetLover', 'SportsFan', 'MindfulMeditator',
    'DIYExpert', 'FashionForward', 'HealthyLiving', 'TechReviewer', 'LifeHacker',
    'CreativeWriter', 'MathWizard', 'HistoryBuff', 'LanguageLearner', 'StartupFounder'
];

const sampleVideoTitles = [
    'Ultimate Guide to Web Development in 2024',
    'Amazing Sunset Timelapse from the Mountains',
    'How to Cook Perfect Pasta Every Time',
    'Top 10 Travel Destinations You Must Visit',
    'JavaScript Tips and Tricks for Beginners',
    'Morning Yoga Routine for Better Health',
    'Building Your First Mobile App',
    'Street Photography Masterclass',
    'The Science Behind Climate Change',
    'Productivity Hacks That Actually Work',
    'Learning Python in 30 Days',
    'Home Workout Without Equipment',
    'Digital Art Tutorial for Beginners',
    'Understanding Cryptocurrency Basics',
    'Meditation Techniques for Stress Relief',
    'React vs Vue: Which Framework to Choose',
    'Healthy Meal Prep Ideas',
    'Photography Composition Rules',
    'Machine Learning Explained Simply',
    'Guitar Lessons for Complete Beginners'
];

const sampleDescriptions = [
    'In this comprehensive tutorial, we dive deep into the fundamentals and advanced concepts.',
    'Join me on this incredible journey as we explore new possibilities and techniques.',
    'Learn step-by-step how to master this skill with practical examples and real-world applications.',
    'Discover the secrets that professionals use to achieve outstanding results.',
    'A complete guide covering everything you need to know from basics to advanced level.',
    'Transform your understanding with these proven methods and strategies.',
    'Get ready to level up your skills with this detailed walkthrough.',
    'Everything you need to know to get started and become proficient.',
    'Professional tips and techniques that will make a real difference.',
    'The ultimate resource for anyone looking to improve their knowledge and skills.'
];

const videoCategories = [
    'Technology', 'Education', 'Entertainment', 'Music', 'Gaming',
    'Sports', 'Travel', 'Food', 'Health', 'Art', 'Science', 'Business'
];

// Cloudinary sample images (public domain)
const sampleAvatars = [
    'https://res.cloudinary.com/demo/image/upload/w_150,h_150,c_fill,g_face/sample.jpg',
    'https://res.cloudinary.com/demo/image/upload/w_150,h_150,c_fill,g_face/woman.jpg',
    'https://res.cloudinary.com/demo/image/upload/w_150,h_150,c_fill,g_face/man.jpg',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
];

const sampleThumbnails = [
    'https://res.cloudinary.com/demo/image/upload/w_640,h_360,c_fill/sample.jpg',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=360&fit=crop',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=640&h=360&fit=crop',
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=640&h=360&fit=crop'
];

const sampleVideoUrls = [
    'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
];

// Utility functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Generate realistic email from username
const generateEmail = (username) => {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
    return `${username.toLowerCase()}@${getRandomElement(domains)}`;
};

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME || 'videotube'}`);
        console.log('✅ Connected to MongoDB for test data generation');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Generate test users
const generateUsers = async (count = 75) => {
    console.log(`🔄 Generating ${count} test users...`);
    const users = [];
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    for (let i = 0; i < count; i++) {
        const username = `${getRandomElement(sampleUsernames)}_${getRandomNumber(100, 999)}`;
        const user = {
            username: username.toLowerCase(),
            email: generateEmail(username),
            fullName: username.replace(/([A-Z])/g, ' $1').trim(),
            avatar: getRandomElement(sampleAvatars),
            coverImage: Math.random() > 0.3 ? getRandomElement(sampleThumbnails) : '',
            password: hashedPassword,
            isEmailVerified: Math.random() > 0.2, // 80% verified
            createdAt: getRandomDate(new Date(2023, 0, 1), new Date()),
        };
        users.push(user);
    }

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} test users`);
    return createdUsers;
};

// Generate test videos
const generateVideos = async (users, count = 350) => {
    console.log(`🔄 Generating ${count} test videos...`);
    const videos = [];

    for (let i = 0; i < count; i++) {
        const owner = getRandomElement(users);
        const title = getRandomElement(sampleVideoTitles);
        const category = getRandomElement(videoCategories);
        
        const video = {
            videoFile: getRandomElement(sampleVideoUrls),
            thumbnail: getRandomElement(sampleThumbnails),
            title: `${title} - ${category} Edition`,
            description: `${getRandomElement(sampleDescriptions)} This ${category.toLowerCase()} content will help you understand the concepts better. Don't forget to like and subscribe!`,
            duration: getRandomNumber(60, 3600), // 1 minute to 1 hour
            view: getRandomNumber(0, 100000),
            isPublished: Math.random() > 0.1, // 90% published
            owner: owner._id,
            createdAt: getRandomDate(new Date(2023, 0, 1), new Date()),
        };
        videos.push(video);
    }

    const createdVideos = await Video.insertMany(videos);
    console.log(`✅ Created ${createdVideos.length} test videos`);
    return createdVideos;
};

export { connectDB, generateUsers, generateVideos, getRandomElement, getRandomNumber, getRandomDate };

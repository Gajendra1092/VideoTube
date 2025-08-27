// TEST DATA GENERATION SCRIPT - DO NOT COMMIT TO GIT
// This script generates realistic test data for performance testing

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../src/models/user.models.js';
import { Video } from '../src/models/video.models.js';
import { Like } from '../src/models/like.models.js';
import { Comment } from '../src/models/comment.models.js';
import { Subscription } from '../src/models/subscriptions.models.js';
import { VideoView } from '../src/models/videoView.models.js';
import { WatchHistory } from '../src/models/watchHistory.models.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample data arrays for realistic content generation
const sampleUsernames = [
    'CodeMasterPro', 'DevTechAcademy', 'FullStackDev', 'ReactExpert', 'NodeJSGuru',
    'PythonMaster', 'DataSciencePro', 'CloudArchitect', 'DevOpsEngineer', 'CyberSecPro',
    'MLEngineer', 'WebDevTutor', 'SoftwareEngineer', 'TechEducator', 'ProgrammingHub',
    'CodeWithJohn', 'TechMentorAI', 'DevSkillsUp', 'CodingBootcamp', 'TechCareerPath',
    'AdvancedCoding', 'ProDeveloper', 'TechInnovator', 'CodeAcademy', 'DevMasterclass',
    'TechTutorials', 'CodingExpert', 'SoftwareDev', 'TechTraining', 'DevCommunity'
];

const sampleVideoTitles = [
    'Complete Full-Stack Web Development Course 2024',
    'Advanced React.js Patterns and Best Practices',
    'Node.js & Express.js Backend Development Masterclass',
    'Modern JavaScript ES6+ Features Explained',
    'Building Scalable APIs with MongoDB & Express',
    'Docker & Kubernetes for Developers',
    'AWS Cloud Computing Fundamentals',
    'Python Data Science & Machine Learning',
    'Mobile App Development with React Native',
    'DevOps CI/CD Pipeline Tutorial',
    'System Design Interview Preparation',
    'Database Design & Optimization Techniques',
    'Microservices Architecture Explained',
    'GraphQL vs REST API Comparison',
    'TypeScript for JavaScript Developers',
    'Git & GitHub Workflow Best Practices',
    'Responsive Web Design with CSS Grid & Flexbox',
    'Testing Strategies: Unit, Integration & E2E',
    'Performance Optimization for Web Applications',
    'Cybersecurity Fundamentals for Developers'
];

const sampleDescriptions = [
    'Master modern web development with this comprehensive course covering frontend, backend, and deployment strategies. Perfect for developers looking to advance their careers.',
    'Learn industry-standard practices and advanced patterns used by top tech companies. Includes real-world projects and code examples.',
    'Build production-ready applications with best practices for scalability, security, and performance optimization.',
    'Comprehensive tutorial covering everything from basics to advanced concepts with hands-on coding exercises.',
    'Professional-grade development techniques used in enterprise applications. Includes project-based learning.',
    'Step-by-step guide with practical examples and real-world use cases. Perfect for interview preparation.',
    'Industry expert shares proven strategies and methodologies used in top tech companies.',
    'Complete walkthrough with source code, documentation, and deployment instructions included.',
    'Advanced concepts explained simply with practical demonstrations and best practices.',
    'Professional development course designed for career advancement and skill enhancement.'
];

const videoCategories = [
    'Web Development', 'Software Engineering', 'Data Science', 'DevOps', 'Mobile Development',
    'Cloud Computing', 'Machine Learning', 'Cybersecurity', 'Database Design', 'System Design'
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
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=360&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=640&h=360&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=640&h=360&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=640&h=360&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop&q=80'
];

const sampleVideoUrls = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
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
const generateUsers = async (count = 35) => {
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
const generateVideos = async (users, count = 90) => {
    console.log(`🔄 Generating ${count} test videos...`);
    const videos = [];

    for (let i = 0; i < count; i++) {
        const owner = getRandomElement(users);
        const title = getRandomElement(sampleVideoTitles);
        const category = getRandomElement(videoCategories);
        
        const video = {
            videoFile: getRandomElement(sampleVideoUrls),
            thumbnail: getRandomElement(sampleThumbnails),
            title: `${title}`,
            description: `${getRandomElement(sampleDescriptions)} This comprehensive ${category.toLowerCase()} tutorial includes source code, practical exercises, and real-world examples. Perfect for developers at all levels.`,
            duration: getRandomNumber(300, 7200), // 5 minutes to 2 hours (more realistic for tech content)
            view: getRandomNumber(1000, 500000), // Higher view counts for professional demo
            isPublished: Math.random() > 0.05, // 95% published
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

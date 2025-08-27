// PRODUCTION DATABASE CHECK SCRIPT - TEMPORARY
import mongoose from 'mongoose';
import { User } from '../src/models/user.models.js';
import { Video } from '../src/models/video.models.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkProductionData() {
  try {
    console.log('🔍 Connecting to production database...');
    await mongoose.connect(`${process.env.MONGODB_URI}/videotube`);
    console.log('✅ Connected to MongoDB Atlas');
    
    const userCount = await User.countDocuments();
    const videoCount = await Video.countDocuments();
    
    console.log('\n📊 Production Database Status:');
    console.log('👥 Total Users:', userCount);
    console.log('🎬 Total Videos:', videoCount);
    
    // Check for test users (our professional usernames)
    const testUsers = await User.find({ 
      username: { 
        $regex: /^(codemasterpro|devtechacademy|fullstackdev|reactexpert|nodejsguru)/i 
      } 
    }).limit(10);
    
    console.log('\n🧪 Test Users Found:', testUsers.length);
    if (testUsers.length > 0) {
      console.log('Sample test users:');
      testUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.email})`);
      });
    }
    
    // Check for test videos (our professional titles)
    const testVideos = await Video.find({ 
      title: { 
        $regex: /(Complete Full-Stack|Advanced React|Node\.js|JavaScript|Python|Docker)/i 
      } 
    }).limit(10);
    
    console.log('\n🎥 Test Videos Found:', testVideos.length);
    if (testVideos.length > 0) {
      console.log('Sample test videos:');
      testVideos.forEach((video, index) => {
        console.log(`  ${index + 1}. ${video.title} (${video.view} views)`);
      });
    }
    
    // Check recent videos
    const recentVideos = await Video.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner', 'username');
    
    console.log('\n📅 Most Recent Videos:');
    recentVideos.forEach((video, index) => {
      console.log(`  ${index + 1}. "${video.title}" by ${video.owner?.username || 'Unknown'}`);
      console.log(`     Views: ${video.view}, Created: ${video.createdAt.toDateString()}`);
    });
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkProductionData();

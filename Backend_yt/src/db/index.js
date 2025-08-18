import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connection successful !! HOST: ${ connectionInstance.connection.host}`);
    }
    catch(error){
        console.error("MONGO_DB Connection Error:" ,error);
        process.exit(1);
    }
} // async await in database connection is necessary and do not have any alternative.

export default connectDB;
// require('dotenv').config({path:{./env}}); // to load environment variables
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({ path: "./.env" });

connectDB()
.then(()=>{

    app.on("error", (error)=> {console.error("MongoDB connection error:", error)
    throw error}); // This line checks that after connecting to DB if api is able to talk to DB or not.

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
    });

})
.catch((error) => {
    console.error("ERROR:", error);
    throw error;                    
}); // This line will catch any error that occurs during the connection to the DB.









// const app = express();

// ;(async () => {
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); // here we are concatinating the DB_NAME and URL hence $ sign is used.
//        app.on("error", (error)=> {console.error("MongoDB connection error:", error);
//        throw error;
//     }); // This line checks that after connecting to DB if api is able to talk to DB or not.

//     app.listen(process.env.PORT, () => {
//         console.log(`Server is running on port ${process.env.PORT}`);
//     })
       

//     }
//     catch(error){
//         console.error("ERROR:" ,error);
//         throw error;
//     }
// })();
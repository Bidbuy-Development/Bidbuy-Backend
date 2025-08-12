import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

//mongoDb database connection setup
const connectDB =() =>{
    mongoose.connect(process.env.MONGO_URI) //mongo url
    try {
        console.log("mongoDb connected ")
    } catch (error) {
       console.log("connection failed") 
    }
}


export default connectDB;
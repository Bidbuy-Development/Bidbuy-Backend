// For the Server 
// Starting the Server for bidbuy
import express from "express";
import connectDB  from "./config/db.js";
const app = express();
const PORT = 3000;


app.get("/", (req, res) => {
    console.log("Welcome to Bidbuy");
});



app.listen(PORT, () => {
    // connectDB(); make sure to include mongo url on your .env before you uncomment this 
    console.log(`This server is running on ${PORT}`);
})

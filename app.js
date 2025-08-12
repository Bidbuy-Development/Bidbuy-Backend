// For the Server 
// Starting the Server for bidbuy
import express from "express";
const app = express();
const PORT = 3000;


app.get("/", (req, res) => {
    console.log("Welcome to Bidbuy");
});



app.listen(PORT, () => {
    console.log(`This server is running on ${PORT}`);
})

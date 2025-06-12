
const mongoose = require ("mongoose");
const express = require("express" );

const app = express();

//----------------- 1. Connect to MongoDB (only once when the server starts)
mongoose
    .connect("mongodb://localhost:27017/my_first_db")
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection error:",err));

//------------------- 2. Define the scheme based on your sample document-----------------------------------
const userSchema = new mongoose.Schema({
    name: {type: String, require: true},
    age: {type: Number},
    email: {type: String, unique: true},
    createdAt: {type: Date, default: Date.now},
    },
    { collection: "student"}
); // <-- explicitly specify the collection name
const user = mongoose.model("User", userSchema);
// 3. Create the model
const newUser = new user({name: "Gabo", age: 25, email: "prueba@gmail.com"});
await newUser.save();
//-------------------- 4. Define rout to get all students ------------------------
app.get("/students", async (req, res) => {
    const students = await Student.find();
    res.json(students);
});
//------------------ 5. Start the server
app.listen(3000, () => {
console.log("Server is running on http://localhost:3000");
});

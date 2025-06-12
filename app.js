//-----------Declaramos las extensiones -------
const express = require("express");
const chalk = require("chalk");
const path = require("path");
const morgan = require("morgan");
const session = require("express-session");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Feed = require("./model/feed");
const User = require("./model/user");

const app = express();

//-----------Enrutamos extensiones --------------
app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));

// Connect to MongoDB (only once when the server starts)
mongoose
    .connect("mongodb://localhost:27017/my_first_db")
    .then(() => console.log(chalk.bgHex("#80A2A6").black.bold(" 🌤️ MongoDB Connected 🌤️ ")))
    .catch(console.error);

//--- Configuramos ejs en Express-------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(morgan("common"));
app.use(session({
    secret: "myPass123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 5,
    }, // 5 minutos
}));

//app.use(session({secret:"mySecretKey", resave: false, saveUninitialized: true}));
app.use(session({
    secret: "mySecretKey",
    resave: false,
    saveUnitializes: false,
    cookie: {
        maxAge: 1000 * 60 * 5, //son 5 mins
    },
}));

app.get("/", (req,res) => {
    res.render("index", {username: req.session.username});
});

app.use(express.urlencoded({ extended: true }));

app.get("/write", (req,res) => {
    if (req.session.username) {
    res.render("write",);
} else {
    res.redirect("/");
}
});

app.post("/write" , async (req, res) => {
    const { content } = req.body;
        if (!req.session.username) {
            res.redirect("/");
}

const newFeed = new Feed({
    content,
    author: req.session.username,
});

// Save the new feed to the database
// and redirect to the posts page
await newFeed
    .save()
    .then(() => {
        console.log("Feed saved successfully" );
        res.redirect("/posts" );
        })
    .catch((err) => {
        console.error("Error saving feed:" , err);
        res.status(500).send("Error saving feed" );
        });
    });

app.get("/posts", async (req,res) => {
       if (!req.session.username){
            return res.redirect("/");
        }
    try {
        const posts = await Feed.find({ author: req.session.username }).sort({
            createdAt: -1,
        });
        res.render("posts", { posts });
    } catch (error) {
        console.error 
            console.error("Error loading posts", err);
            res.status(500).send("Error loading posts");
        
    }
});

app.post("/login", async (req, res) => {

const { username, password } = req.body;
            try {
                const user = await User.findOne({ username });
                    if (!user || !(await bcrypt.compare(password, user.password))) {
                    return res.send("Invalid username or password!");
                }
                req.session.username = user.username;
                res.redirect("/posts");
            } catch (err) {
                console.error("Error during login:", err);
                res.status(500).send("Error during login");
            }
        });

app.get("/logout", (req, res) =>{
    req.session.destroy((err) => {
      if (err) {
        return res.send("Error logging out");
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
});

app.get("/register", (req,res) =>{
    res.render("register",);
});


app.post("/register", async (req, res) => {
    const { username, password, name } = req.body;
        try {
    const existingUser = await User.findOne({ username });
        if (existingUser) {
        return res.send("Username already exists!");
        }
    const newUser = new User({ username, password, name });
        await newUser.save();
        res.redirect("/");
        } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).send("Error during registration");
        }
    });

app.get("/friends/list", async (req, res) => {
    if (!req.session.username) {
        return res.redirect("/");
        }
    try {
        const user = await User.findOne({ username:req.session.username });
        res.render("friends", 
            { friends: user.friends,
            findedfriends: [] 
        });
        } catch (err) {
            console.error("Error fetching friends list:", err);
        res.status(500).send("Error fetching friends list");
        }
});

app.post("/friends/search", async (req, res) => {
    const { friendUsername } = req.body;
        if (!req.session.username) {
        return res.redirect("/");
            }
        try {
        // Search for the logged-in user
            const user = await User.findOne({ username: req.session.username });

        // Search for users whose username includes the search term
            const findedfriends = await User.find({
                $and: [
            // includes search term
                { username: { $regex: friendUsername, $options: "i" } },
                // exclude already added friends and self
                { username: { $nin: [...user.friends, user.username] } },
                ],
            });

        res.render("friends", { friends: user.friends, findedfriends });
    } catch (err) {
    console.error("Error searching for friends:", err);
    res.status(500).send("Error searching for friends");
    }
});

app.post("/friends/add", async (req, res) => {
    const { friendUsername } = req.body;
    if (!req.session.username) {
        return res.redirect("/");
    }
    try {
        const user = await User.findOne({
            username:
                req.session.username
        });
        const friend = await User.findOne({
            username:
                friendUsername
        });
        if (!friend) {
            return res.send("User not found!");
        }
        if (user.friends.includes(friend.username)) {
            return res.send("Already friends!");
        }
        user.friends.push(friend.username);
        await user.save();
        res.redirect("/friends/list");
    } catch (err) {
        console.error("Error adding friend:", err);
        res.status(500).send("Error adding friend");
    }
});


app.listen(3000, () => {
    console.log(chalk.bgHex("#80A2A6").white.italic(" EXPRESS Server is running" ));
    console.log(chalk.bgHex("#BF5934")("Running at: ") + chalk.blackBright("http://localhost:3000"));
    console.log(chalk.gray("Press Ctrl+C to stop the server."));
});


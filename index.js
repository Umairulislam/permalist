import express from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import pg from "pg"
import bcrypt from "bcrypt"
import session from "express-session"
import passport from "passport"
import { Strategy as LocalStrategy } from "passport-local"

// Initialize environment variables
dotenv.config()

const app = express()
const port = 3000
const saltRounds = 10

// Connect to the PostgreSQL database
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
})

db.connect()
  .then(() => console.log("Connected to the PostgreSQL database"))
  .catch((err) =>
    console.error("Error connecting to the PostgreSQL database", err.stack)
  )

// Set view engine to ejs
app.set("view engine", "ejs")

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

// Setup express session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
  })
)

// Initialize passport
app.use(passport.initialize())
app.use(passport.session())

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/login")
}

// Routes

// Home route
app.get("/", (req, res) => {
  res.render("home")
})

// Login route
app.get("/login", (req, res) => {
  res.render("login")
})

// Register route
app.get("/register", (req, res) => {
  res.render("register")
})

// Todos route (protected)
app.get("/todos", isAuthenticated, async (req, res) => {
  res.render("todos")
  console.log(`Rendering todos for user: ${req.user.email}`)
})

// Login user
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/todos",
    failureRedirect: "/login",
  })
)

// Logout route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out user", err)
      return res.send("Error logging out user")
    }
    console.log("User logged out successfully")
    res.redirect("/")
  })
})

// Register new user
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body
  console.log(`Registering user: ${name}, ${email}`)

  try {
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ])

    if (userCheck.rows.length > 0) {
      res.send("User already exists")
      console.log("User already exists")
    } else {
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      const insertUser = await db.query(
        "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3)",
        [name, email, hashedPassword]
      )
      console.log("User registered successfully")

      const newUser = insertUser.rows[0]
      req.login(newUser, (err) => {
        if (err) {
          console.error("Error logging in user", err)
          return res.send("Error logging in user")
        }
        return res.redirect("/todos")
      })
    }
  } catch (error) {
    console.error("Error registering user", error)
    res.send("Error registering user")
  }
})

// Passport local strategy for email and password authentication
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async function (email, password, cb) {
      try {
        const userCheck = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        )

        if (userCheck.rows.length > 0) {
          const user = userCheck.rows[0]
          console.log("User found: ", user.email)

          const passMatch = await bcrypt.compare(password, user.password)
          if (passMatch) {
            console.log("User logged in successfully")
            return cb(null, user)
          } else {
            console.log("Incorrect password")
            return cb(null, false)
          }
        } else {
          console.log("User does not exist")
          return cb(null, false)
        }
      } catch (error) {
        console.error("Error during authentication", error)
        return cb(error)
      }
    }
  )
)

// Serialize user
passport.serializeUser((user, cb) => {
  cb(null, user.id)
})

// Deserialize user
passport.deserializeUser(async (id, cb) => {
  try {
    const userCheck = await db.query("SELECT * FROM users WHERE id = $1", [id])
    if (userCheck.rows.length > 0) {
      cb(null, userCheck.rows[0])
    } else {
      cb(new Error("User not found"))
    }
  } catch (error) {
    cb(error)
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

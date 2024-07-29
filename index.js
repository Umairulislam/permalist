import express from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import pg from "pg"
import bcrypt from "bcrypt"

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

// Routes

// Home route
app.get("/", (req, res) => {
  res.render("home")
  console.log("Rendering home page")
})

// Login route
app.get("/login", (req, res) => {
  res.render("login")
  console.log("Rendering login page")
})

// Register route
app.get("/register", (req, res) => {
  res.render("register")
  console.log("Rendering register page")
})

// Register new user
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body
  console.log(`Registering user: ${name}, ${email}`)

  try {
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ])

    console.log(`User check result: ${JSON.stringify(userCheck.rows)}`)

    if (userCheck.rows.length > 0) {
      res.send("User already exists")
      console.log("User already exists")
    } else {
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      const insertUser = await db.query(
        "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3)",
        [name, email, hashedPassword]
      )
      console.log(
        "User registered successfully: ",
        JSON.stringify(insertUser.rows)
      )
    }

    res.render("todos.ejs")
  } catch (error) {
    console.error("Error registering user", error)
    res.send("Error registering user")
  }
})

// Login user
app.post("/login", async (req, res) => {
  const { email, password } = req.body
  console.log(`Logging in user with email: ${email}`)

  try {
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ])

    if (userCheck.rows.length > 0) {
      const user = userCheck.rows[0]
      console.log("User found: ", JSON.stringify(user))

      const passMatch = await bcrypt.compare(password, user.password)
      console.log("Password match: ", passMatch)

      if (passMatch) {
        res.render("todos.ejs")
        console.log("User logged in successfully")
      } else {
        res.send("Incorrect password")
        console.log("Incorrect password")
      }
    } else {
      res.send("User does not exist")
      console.log("User does not exist")
    }
  } catch (error) {
    console.error("Error logging in user", error)
    res.send("Error logging in user")
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

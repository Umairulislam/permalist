import express from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import pg from "pg"
import bcrypt from "bcrypt"
import session from "express-session"
import passport from "passport"
import { Strategy as LocalStrategy } from "passport-local"
import { Strategy as GoogleStrategy } from "passport-google-oauth2"
import { Strategy as GitHubStrategy } from "passport-github2"

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
// app.use(express.static("public"))
app.use(serveStatic(path.join(process.cwd(), "public")))

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
  try {
    const getTodos = await db.query("SELECT * FROM todos WHERE user_id = $1", [
      req.user.id,
    ])
    res.render("todos", { todos: getTodos.rows, user: req.user })
    console.log(`Rendering todos for user: ${req.user.email}`)
  } catch (error) {
    console.error("Error fetching todos", error)
    res.send("Error fetching todos")
  }
})

// Add todo
app.post("/todos", isAuthenticated, async (req, res) => {
  const { description } = req.body
  try {
    const checkTodo = await db.query(
      "SELECT * FROM todos WHERE user_id = $1 AND description = $2",
      [req.user.id, description]
    )

    if (checkTodo.rows.length > 0) {
      console.log("Todo already exists")
      const todos = await db.query("SELECT * FROM todos WHERE user_id = $1", [
        req.user.id,
      ])
      return res.render("todos", {
        todos: todos.rows,
        error: "Todo already exists",
      })
    }

    const insertTodo = await db.query(
      "INSERT INTO todos (user_id, description) VALUES ($1, $2)",
      [req.user.id, description]
    )
    console.log("Todo added successfully")
    res.redirect("/todos")
  } catch (error) {
    console.error("Error adding todo", error)
    const todos = await db.query("SELECT * FROM todos WHERE user_id = $1", [
      req.user.id,
    ])
    res.render("todos", { todos: todos.rows, error: "Error adding todo" })
  }
})

// Delete todo
app.post("/todos/delete", isAuthenticated, async (req, res) => {
  const { id } = req.body
  try {
    const deleteTodo = await db.query(
      "DELETE FROM todos WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    )
    console.log("Todo deleted successfully")
    res.redirect("/todos")
  } catch (error) {
    console.error("Error deleting todo", error)
    res.send("Error deleting todo")
  }
})

// Update todo
app.post("/todos/update", isAuthenticated, async (req, res) => {
  const { id } = req.body
  try {
    const getTodo = await db.query(
      "SELECT * FROM todos WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    )
    const isCompleted = !getTodo.rows[0].is_completed
    await db.query(
      "UPDATE todos SET is_completed = $1 WHERE id = $2 AND user_id = $3",
      [isCompleted, id, req.user.id]
    )
    console.log("Todo updated successfully")
    res.redirect("/todos")
  } catch (error) {
    console.error("Error updating todo", error)
    res.send("Error updating todo")
  }
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

// Google OAuth login route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
)

// Google OAuth callback route
app.get(
  "/auth/google/permalist",
  passport.authenticate("google", {
    successRedirect: "/todos",
    failureRedirect: "/login",
  })
)

// GitHub OAuth login route
app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
)

// GitHub OAuth callback route
app.get(
  "/auth/github/permalist",
  passport.authenticate("github", {
    successRedirect: "/todos",
    failureRedirect: "/login",
  })
)

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
        "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING *",
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

// Passport Google OAuth strategy
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/permalist",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log("Google profile: ", profile)
      const email =
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : null // Extract email from the profile

      if (!email) {
        console.error("Email not found in Google profile")
        return cb(
          new Error(
            "Email not found in Google profile. Ensure your Google profile has a valid email address."
          )
        )
      }
      try {
        const userCheck = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [profile.email]
        )

        if (userCheck.rows.length > 0) {
          console.log("Google user found: ", userCheck.rows[0].email)
          return cb(null, userCheck.rows[0])
        } else {
          const insertUser = await db.query(
            "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3)",
            [profile.displayName, profile.email, "google"]
          )
          console.log("Google user registered successfully")
          return cb(null, insertUser.rows[0])
        }
      } catch (error) {
        console.error("Error during Google authentication", error)
        return cb(error)
      }
    }
  )
)

// Passport GitHub OAuth strategy
passport.use(
  "github",
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/github/permalist",
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log("GitHub profile: ", profile)
      const emails = profile.emails || []
      const email = emails.length > 0 ? emails[0].value : null

      if (!email) {
        console.error("Email not found in GitHub profile")
        return cb(
          new Error(
            "Email not found in GitHub profile. Please make sure your email is public in GitHub settings."
          )
        )
      }

      try {
        const userCheck = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        )

        if (userCheck.rows.length > 0) {
          console.log("GitHub user found: ", userCheck.rows[0].email)
          return cb(null, userCheck.rows[0])
        } else {
          const insertUser = await db.query(
            "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3)",
            [profile.displayName, email, "github"]
          )
          console.log("GitHub user registered successfully")
          return cb(null, insertUser.rows[0])
        }
      } catch (error) {
        console.error("Error during GitHub authentication", error)
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

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`)
// })

export default app

import express from "express"
import bodyParser from "body-parser"
import path from "path"

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

// Set view engine to ejs
app.set("view engine", "ejs")

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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

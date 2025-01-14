const express = require("express")
const app = express()
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { MongoClient, ServerApiVersion } = require("mongodb")
require("dotenv").config()
const port = process.env.PORT || 5000

//middlewares
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hrdcqgm.mongodb.net/?appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect()
    // Send a ping to confirm a successful connection
    const userCollection = client.db("jobTaskDb").collection("users")

    //jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      })
      res.send({ token })
    })

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("Inside verify token", req.headers.authorization)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" })
      }
      const token = req.headers.authorization.split(" ")[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" })
        }
        req.decoded = decoded
        next()
      })
    }

    //User Related Api
    app.post("/users", async (req, res) => {
      const salt = await bcrypt.genSaltSync(10)
      const info = req.body
      const { name, number, email, pin, balance, role } = info
      const password = await bcrypt.hashSync(pin, salt)
      console.log(password)
      const doc = { name, number, email, password, balance, role }
      const result = await userCollection.insertOne(doc)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 })
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close()
  }
}
run().catch(console.dir)

app.get("/", (req, res) => {
  res.send("Financial Mobile Service is running")
})

app.listen(port, () => {
  console.log(`Financial Mobile Service is running on port ${port}`)
})

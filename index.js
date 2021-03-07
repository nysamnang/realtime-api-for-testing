const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const socketIO = require("socket.io");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();
const server = app.listen(process.env.PORT || 3000);
const io = socketIO(server);

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/v1", router);

mongoose
  .connect(
    "mongodb+srv://demo:demo123@realtimeapifortesting.sdy4l.mongodb.net/RealTimeAPIForTesting?retryWrites=true&w=majority",
    {
      useCreateIndex: true,
      useNewUrlParser: true
    }
  )
  .then(() => console.log("connected to MongoDB..."));

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  firstName: { type: String },
  lastName: { type: String }
});
const User = mongoose.model("User", UserSchema);

const createUser = (req, res, next) => {
  const user = new User(req.body);

  user.save(err => {
    if (err) {
      next(err);
      io.emit("error", "Failed to create.");
    } else {
      res.json(user);
      io.emit("createUser", user);
    }
  });
};

const getAllUsers = (req, res, next) => {
  User.find((err, users) => {
    if (err) {
      next(err);
    } else {
      res.json(users);
    }
  });
};

const getOneUser = (req, res) => {
  res.json(req.user);
};

const updateUser = (req, res, next) => {
  User.findByIdAndUpdate(req.user._id, req.body, { new: true }, (err, user) => {
    if (err) {
      next(err);
      io.emit("error", "Failed to update.");
    } else {
      res.json(user);
      io.emit("updateUser", user);
    }
  });
};

const deleteUser = (req, res, next) => {
  req.user.remove(err => {
    if (err) {
      next(err);
      io.emit("error", "Failed to delete.");
    } else {
      res.json(req.user);
      io.emit("deleteUser", req.user);
    }
  });
};

const getByIdUser = (req, res, next, id) => {
  User.findOne({ _id: id }, (err, user) => {
    if (err) {
      next(err);
    } else {
      req.user = user;
      next();
    }
  });
};

app.get("/", (req, res) => {
  const URL = req.protocol + "://" + req.get("host") + req.originalUrl;
  res.send(
    `<a href="https://github.com/nysamnang/realtime-api-for-testing">GitHub</a><br /><a href="${URL}api-docs">/api-docs</a>`
  );
});

router
  .route("/users")
  .post(createUser)
  .get(getAllUsers);

router
  .route("/users/:userId")
  .get(getOneUser)
  .put(updateUser)
  .delete(deleteUser);

router.param("userId", getByIdUser);

module.exports = app;

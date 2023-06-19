const express = require("express");

const controller = require("../controllers/mainController.js");
const routes = express.Router();
 
routes.get("/", controller.getLessons);
routes.post("/lessons", controller.addLessons);
 
module.exports = routes;
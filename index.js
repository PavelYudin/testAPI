const express = require("express");
const app = express();

const routes = require("./routes/mainRoute.js");

app.use(express.json());

app.use("/", routes);
 
app.use(function (req, res, next) {
    res.status(404).send("Not Found");
});
 
app.listen(3000);

module.exports = app;
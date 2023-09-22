const jwt = require("jsonwebtoken");


const Users = require("../models/Users");

module.exports = (req, res, next) => {
  const authHeader =  req.get('Authorization');

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
      try {
        if (err) {
          return res.status(401).json({ error: "Unauthorized!" });
        }

        const usar = await Users.findOne({ _id: payload._id }).select(
          "-password"
        );
        req.usar = usar;
        next();
      } catch (err) {
        console.log(err);
      }
    });
  } else {
    return res.status(403).json({ error: "Forbidden 🛑🛑" });
  }
};
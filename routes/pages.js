const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const authController = require("../controllers/auth");

const router = express.Router();

const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

router.get("/", authController.isLoggedIn, function (req, res) {
  res.render("index", { user: req.user });
});

router.get("/register", function (req, res) {
  res.render("register");
});
router.get("/login", function (req, res) {
  res.render("login");
});

router.get("/logout", authController.isLoggedIn, function (req, res) {
  res.render("index");
});

router.get("/profile", authController.isLoggedIn, function (req, res) {
  if (req.user) {
    var sql =
      "select * from users left join students on users.id = students.student_id left join leaves on users.id = leaves.user_id where users.id = ?";
    db.query(sql, [req.user.id], function (err, data, fields) {
      if (err) throw err;
      // console.log(data);
      res.render("profile", { userData: data });
    });
    // res.render("profile", { user: req.user });
  } else {
    res.redirect("login");
  }
});

router.get("/postleaves", authController.isLoggedIn, function (req, res) {
  if (req.user) {
    res.render("postleaves");
  } else {
    res.redirect("login");
  }
});

router.post("/postleaves", authController.isLoggedIn, async function (
  req,
  res
) {
  const { startDate, endDate, description, address, mobileNumber } = req.body;
  console.log(startDate, endDate, description, address, mobileNumber);

  // const decoded = await promisify(jwt.verify)(
  //   req.cookies.jwt,
  //   process.env.JWT_SECRET
  // );

  db.query(
    "INSERT INTO leaves SET ? ",
    {
      user_id: req.user.id,
      description: description,
      start: startDate,
      end: endDate,
      address: address,
      mobile: mobileNumber,
    },
    function (error, result) {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
        return res.render("postleaves", { message: "Request Submitted" });
      }
    }
  );
});

// router.get(
//   "/getleaves",
//   authController.isLoggedIn,
//   authController.authRole,
//   function (req, res) {
//     var sql = "SELECT * FROM leaves";
//     db.query(sql, function (err, data, fields) {
//       if (err) throw err;
//       res.render("getleaves", { title: "Leaves List", userData: data });
//     });
//   }
// );

router.get(
  "/getleaves",
  authController.isLoggedIn,
  authController.authRole,
  function (req, res) {
    if (req.user) {
      var sql = "SELECT * FROM users join leaves on leaves.user_id = users.id";
      db.query(sql, function (err, data, fields) {
        if (err) throw err;
        res.render("getleaves", { title: "Leaves List", userData: data });
      });
    } else {
      res.redirect("login");
    }
  }
);

router.post(
  "/getleaves",
  authController.isLoggedIn,
  authController.authRole,
  function (req, res) {
    if (req.user) {
      console.log(req.body);
      var sql = "update leaves set status = ? where id = ?";
      db.query(sql, [req.body.status, req.body.leaveid], function (
        err,
        data,
        fields
      ) {
        if (err) throw err;
        var sql =
          "SELECT * FROM users join leaves on leaves.user_id = users.id";
        db.query(sql, function (err, data, fields) {
          if (err) throw err;
          res.render("getleaves", { message: "Updated", userData: data });
        });
      });
    } else {
      res.redirect("login");
    }
  }
);
router.post("/postinfo", authController.isLoggedIn, function (req, res) {
  if (req.user) {
    console.log(req.body);
    var sql =
      "update students set student_name = ?, student_roll= ?, student_mobile= ? where student_id = ?";
    db.query(
      sql,
      [req.body.name, req.body.roll, req.body.mobile, req.user.id],
      function (err, data, fields) {
        if (err) throw err;
        var sql =
          "select * from users left join students on users.id = students.student_id left join leaves on users.id = leaves.user_id where users.id = ?";
        db.query(sql, [req.user.id], function (err, data, fields) {
          if (err) throw err;
          // console.log(data);
          res.render("profile", { userData: data });
        });
      }
    );
  } else {
    res.redirect("login");
  }
});

module.exports = router;

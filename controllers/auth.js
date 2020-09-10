const mysql = require("mysql");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");

const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

exports.register = function (req, res) {
  // console.log(req.body);

  // const name = req.body.name;
  // const email = req.body.email;
  // const password = req.body.password;
  // const passwordConfirm = req.body.passwordConfirm;

  //After Object destructuring
  const { email, password, passwordConfirm, roleSelect } = req.body;

  db.query("select email from users where email = ?", [email], async function (
    error,
    results
  ) {
    if (error) {
      console.log(error);
    }
    if (results.length > 0) {
      return res.render("register", {
        message: "The email is already in use",
      });
    } else if (password !== passwordConfirm) {
      return res.render("register", {
        message: "The passwords do not match",
      });
    }

    let hashedPassword = await bcrypt.hash(password, 8);
    // console.log(hashedPassword);

    // res.send('testing');
    db.query(
      "INSERT INTO users SET ? ",
      { email: email, password: hashedPassword, roleid: roleSelect },
      function (error, result) {
        if (error) {
          console.log(error);
        } else {
          // console.log(result);
          return res.render("register", { message: "User registered" });
        }
      }
    );
  });
};

exports.login = async function (req, res) {
  try {
    const { email, password } = req.body;
    // console.log(email, password);

    if (!email || !password) {
      return res
        .status(400)
        .render("login", { message: "Please provide an email and password" });
    }

    db.query("SELECT * FROM users WHERE email = ? ", [email], async function (
      error,
      results
    ) {
      // console.log(results);
      if (!results || !(await bcrypt.compare(password, results[0].password))) {
        res.status(401).render("login", {
          message: "The email or the password is incorrect",
        });
      } else {
        const id = results[0].id;

        const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN,
        });

        // console.log("The token is: " + token);

        const cookieOptions = {
          expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
          ),
          httpOnly: true,
        };

        res.cookie("jwt", token, cookieOptions);
        res.status(200).redirect("/");
      }
    });
  } catch (error) {
    console.log(error);
  }
};

exports.isLoggedIn = async function (req, res, next) {
  // console.log(req.cookies.jwt);
  if (req.cookies.jwt) {
    try {
      //verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log(decoded);

      //check if the user still exists
      db.query("SELECT * FROM users WHERE id = ?", [decoded.id], function (
        error,
        result
      ) {
        // console.log(result);
        if (!result) {
          return next();
        }

        req.user = result[0];
        return next();
      });
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};

exports.logout = async function (req, res) {
  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  }); // if there is already a cookie called 'jwt', then this will overwrite it.
  res.status(200).redirect("/");
};

exports.authRole = async function (req, res, next) {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log(decoded);
      db.query("SELECT * FROM users WHERE id = ?", [decoded.id], function (
        error,
        result
      ) {
        if (result[0].roleid !== 2) {
          res.status(403);
          return res.send("<h1>Not allowed</h1>");
        }

        next();
      });
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};
// exports.postLeave = async function (req, res) {
//   const { startDate, endDate, description, address, mobileNumber } = req.body;
//   console.log(startDate, endDate, description, address, mobileNumber);

//   const decoded = await promisify(jwt.verify)(
//     req.cookies.jwt,
//     process.env.JWT_SECRET
//   );

//   db.query(
//     "INSERT INTO leaves SET ? ",
//     {
//       user_id: decoded.id,
//       description: description,
//       start: startDate,
//       end: endDate,
//       address: address,
//       mobile: mobileNumber,
//     },
//     function (error, result) {
//       if (error) {
//         console.log(error);
//       } else {
//         console.log(result);
//         return res.render("postleaves", { message: "Request Submitted" });
//       }
//     }
//   );
// };

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;
const cookieParser = require("cookie-parser");

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  // b2xVn2: "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com",
};
const users = {
  // userRandomID: {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur",
  // },
  // user2RandomID: {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk",
  // },
};

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function generateRandomString() {
  let res = "";
  for (let i = 0; i < 6; i++) {
    res += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return res;
}
function emailChecker(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
}

function findUserByEmail(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
}

//Routes

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] };
  console.log(templateVars);
  // console.log(templateVars);
  // res.render("urls_register", templateVars);
  res.render("urls_register", templateVars);
});
app.post("/register", (req, res) => {
  // If the e-mail or password are empty strings, send back a response with the 400 status code.
  console.log("req.body", req.body);
  const email = req.body.email;
  const password = req.body.password;
  console.log(users);
  if (email === "" || password === "") {
    res.status(400).send("Oh email is empty");
    return;
  }
  // If someone tries to register with an email that is already in the users object, send back a response with the 400 status code. Checking for an email in the users object is something we'll need to do in other routes as well. Consider creating an email lookup helper function to keep your code DRY
  if (emailChecker(email)) {
    res.status(400).send("email already exists");
    return;
  }
  const id = generateRandomString();
  users[id] = { id: id, email: req.body.email, password: req.body.password };
  res.cookie("user_id", id);
  res.redirect("/urls");
  console.log(users);
});

app.post("/login", (req, res) => {
  const candidateEmailAddress = req.body.email;
  const candidatePassword = req.body.password;
  if (!emailChecker(candidateEmailAddress)) {
    return res.status(403).send("email not found");
  }

  if (findUserByEmail(candidateEmailAddress).password !== candidatePassword) {
    return res.status(403).send("password does not match");
  }
  res.cookie("user_id", findUserByEmail(candidateEmailAddress).id);
  res.redirect("/urls");
});
app.get("/login", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] };
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const short_url = generateRandomString();
  urlDatabase[short_url] = req.body.longURL;
  res.redirect(`/urls/${short_url}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

function urlsForUser(id) {
  const res = {};
  for (const item in urlDatabase) {
    if (id === urlDatabase[item].userID) {
      res[item] = {};
      res[item]["longURL"] = urlDatabase[item].longURL;
      res[item]["userID"] = urlDatabase[item].userID;
    }
  }
  return res;
}

//Routes

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (req.cookies["user_id"] === undefined) {
    res.send("<h1>Please log in or register first.</h1>");
    return;
  }
  const loggedInUserId = req.cookies["user_id"];
  const filteredDatabase = urlsForUser(loggedInUserId);
  const templateVars = {
    urls: filteredDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  // If the e-mail or password are empty strings, send back a response with the 400 status code.
  const email = req.body.email;
  const password = req.body.password;
  console.log(users);
  if (email === "" || password === "") {
    res.status(400).send("<h1>Oh email is empty<h1>");
    return;
  }
  // If someone tries to register with an email that is already in the users object
  if (emailChecker(email)) {
    res.status(400).send("<h1>email already exists<h1>");
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
    return res.status(403).send("<h1>email not found<h1>");
  }

  if (findUserByEmail(candidateEmailAddress).password !== candidatePassword) {
    return res.status(403).send("<h1>password does not match<h1>");
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
  if (users[req.cookies["user_id"]] !== undefined) {
    const short_url = generateRandomString();
    urlDatabase[short_url] = {};
    urlDatabase[short_url].longURL = req.body.longURL;
    urlDatabase[short_url].userID = req.cookies["user_id"];
    res.redirect(`/urls/${short_url}`);
    return;
  }
  return res
    .status(400)
    .send("<h1>Error: none logged in user cannot add a new url<h1>");
});

//delete end point
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentShortURL = req.params.shortURL;
  console.log(urlDatabase[currentShortURL]);
  //If a URL with the given id does not exist
  if (urlDatabase[currentShortURL] === undefined) {
    res.send("<h1>Error: a URL with the given id does not exist<h1>");
    return;
  }
  //user not logged in
  if (currentUserId === undefined) {
    res.send("<h1>Please log in or register first.</h1>");
    return;
  }
  //user is logged in but does not own the URL with the given id
  const urlMatchedId = urlDatabase[currentShortURL].userID;
  if (currentUserId !== urlMatchedId) {
    res.send(
      "<h1>Error: user is logged in but does not own the URL with the given id<h1>"
    );
    return;
  }
  delete urlDatabase[currentShortURL];
  return res.redirect("/urls");
});

//update end point
app.post("/urls/:id", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentShortURL = req.params.id;
  console.log(urlDatabase[currentShortURL]);
  //If a URL with the given id does not exist
  if (urlDatabase[currentShortURL] === undefined) {
    res.send("<h1>Error: a URL with the given id does not exist<h1>");
    return;
  }
  //user not logged in
  if (currentUserId === undefined) {
    res.send("<h1>Please log in or register first.</h1>");
    return;
  }
  //user is logged in but does not own the URL with the given id
  const urlMatchedId = urlDatabase[currentShortURL].userID;
  if (currentUserId !== urlMatchedId) {
    res.send(
      "<h1>Error: user is logged in but does not own the URL with the given id<h1>"
    );
    return;
  }
  urlDatabase[currentShortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  // If someone is not logged in when trying to access /urls/new, redirect them to the login page. Ensure that a none logged in user cannot add a new url with a POST request to /urls.
  if (users[req.cookies["user_id"]] === undefined) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

//update end point
app.get("/urls/:shortURL", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentShortURL = req.params.shortURL;
  //If a URL with the given id does not exist
  if (urlDatabase[currentShortURL] === undefined) {
    res.send("<h1>Error: a URL with the given id does not exist<h1>");
    return;
  }
  //user not logged in
  if (currentUserId === undefined) {
    res.send("<h1>Please log in or register first.</h1>");
    return;
  }
  //user is logged in but does not own the URL with the given id
  const urlMatchedId = urlDatabase[currentShortURL].userID;
  if (currentUserId !== urlMatchedId) {
    res.send(
      "<h1>Error: user is logged in but does not own the URL with the given id<h1>"
    );
    return;
  }
  const templateVars = {
    shortURL: currentShortURL,
    longURL: urlDatabase[currentShortURL].longURL,
    user: users[currentUserId],
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

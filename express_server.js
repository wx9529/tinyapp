const urlExists = require("url-exists");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const {
  getUserByEmail,
  emailChecker,
  urlsForUser,
  generateRandomString,
} = require("./helpers");
const app = express();
const PORT = 8080;

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["secure", "checker", "keys"],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);
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

//Routes
app.get("/", (req, res) => {
  const loggedInUserId = req.session.user_id;
  if (loggedInUserId !== undefined) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const loggedInUserId = req.session.user_id;
  if (loggedInUserId === undefined) {
    res.send("<h1>Please log in or register first.</h1>");
    return;
  }
  const filteredDatabase = urlsForUser(loggedInUserId, urlDatabase);
  const templateVars = {
    urls: filteredDatabase,
    user: users[loggedInUserId],
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const loggedInUserId = req.session.user_id;
  if (loggedInUserId !== undefined) {
    return res.redirect("/urls");
  }
  const templateVars = { user: loggedInUserId };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  // If the e-mail or password are empty strings, send back a response with the 400 status code.
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "" || password === "") {
    res.status(400).send("<h1>email or password is empty<h1>");
    return;
  }
  // If someone tries to register with an email that is already in the users object
  if (emailChecker(email, users)) {
    res.status(400).send("<h1>email already exists<h1>");
    return;
  }
  const id = generateRandomString(characters);
  users[id] = { id, email, password: hashedPassword };
  console.log(users);
  //set the user_id key on a session
  req.session.user_id = id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const candidateEmailAddress = req.body.email;
  const candidatePassword = req.body.password;
  if (!emailChecker(candidateEmailAddress, users)) {
    return res.status(403).send("<h1>email not found<h1>");
  }
  const hashedPassword = getUserByEmail(candidateEmailAddress, users).password;
  if (!bcrypt.compareSync(candidatePassword, hashedPassword)) {
    return res.status(403).send("<h1>password does not match<h1>");
  }
  //set the user_id key on a session
  req.session.user_id = getUserByEmail(candidateEmailAddress, users).id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const loggedInUserId = req.session.user_id;
  if (loggedInUserId !== undefined) {
    return res.redirect("urls");
  }
  const templateVars = { user: loggedInUserId };
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  //destroy a session
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const loggedInUserId = req.session.user_id;
  if (users[loggedInUserId] !== undefined) {
    const short_url = generateRandomString(characters);
    urlDatabase[short_url] = {};
    urlDatabase[short_url].longURL = req.body.longURL;
    urlDatabase[short_url].userID = req.session.user_id;
    res.redirect(`/urls/${short_url}`);
    return;
  }
  return res
    .status(400)
    .send("<h1>Error: none logged in user cannot add a new url<h1>");
});

//delete end point
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUserId = req.session.user_id;
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
  delete urlDatabase[currentShortURL];
  return res.redirect("/urls");
});

//update end point
app.post("/urls/:id", (req, res) => {
  const currentUserId = req.session.user_id;
  const currentShortURL = req.params.id;

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
  if (users[req.session.user_id] === undefined) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.send("<h1>Given URL does not exist</h1>");
  }
  const URL = urlDatabase[req.params.shortURL].longURL;
  urlExists(URL, function (err, exists) {
    if (exists) {
      return res.redirect(URL);
    }
    res.send("<h1>Given URL does not exist</h1>");
  });
});

//update end point
app.get("/urls/:shortURL", (req, res) => {
  const currentUserId = req.session.user_id;
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

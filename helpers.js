const getUserByEmail = function (email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
};
const emailChecker = function (email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return true;
    }
  }
  return false;
};
const urlsForUser = function (id, database) {
  const res = {};
  for (const item in database) {
    if (id === database[item].userID) {
      res[item] = {};
      res[item]["longURL"] = database[item].longURL;
      res[item]["userID"] = database[item].userID;
    }
  }
  return res;
};
const generateRandomString = (characters) => {
  let res = "";
  for (let i = 0; i < 6; i++) {
    res += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return res;
};
module.exports = {
  getUserByEmail,
  emailChecker,
  urlsForUser,
  generateRandomString,
};

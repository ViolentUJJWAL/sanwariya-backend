const { signup, signin, signout } = require("../../controllers/adminControllers/auth.controller");

module.exports = (router) => {
    // Example route for getting all users
    router.post("/auth/signup", signup);
    router.post("/auth/signin", signin);
    router.get("/auth/signout", signout);
};

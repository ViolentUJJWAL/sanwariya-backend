module.exports = (router) => {
    // Example route for getting all users
    router.get('/auth', (req, res) => {
        res.send('List of users route');
    });
};

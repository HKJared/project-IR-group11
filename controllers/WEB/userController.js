class UserController {
    static async getLoginRegisterPage(req, res) {
        try {
            return res.status(200).render('client/login-register');
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }

    static async getHomePage(req, res) {
        try {
            return res.status(200).render('client/index');
        } catch (error) {
            console.error(error);
            return res.status(404).render('server-error');
        }
    }
}

module.exports = UserController;
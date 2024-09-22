const UserModel = require('../models/userModel');
const JWTService = require('../utils/jwtService');


const authenticate = async (req, res, next) => {
    try {
        // Lấy token từ header của request
        const token = req.headers.authentication;

        if (!token) {
            return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." });
        }

        // Giải mã token
        const decoded = await JWTService.decodeRefreshToken(token);
        
        if (!decoded) {
            return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." });
        }
        
        const user_id = decoded.user_id;
        
        if (!user_id) {
            return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." });
        }
            
        const account = await UserModel.getUserById(user_id);
        
        if (account.refresh_token != token) {
            return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." });
        }

        req.user_id = user_id;
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Lỗi từ phía server.' });
    }
};

module.exports = authenticate;
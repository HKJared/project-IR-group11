const pool = require('../configs/connectDB');
const diacritics = require('diacritics');
const generateUniqueName = require('../../utils/generateUniqueName');

class UserModel {
    static async createUser(account) {
        const fullname = generateUniqueName();

        const queryString = `
        INSERT INTO users (username, password, fullname, phone_number, role_id)
        VALUES (?, ?, ?, ?, ?)
        `;

        try {
            const [result] = await pool.execute(queryString, [account.username, account.password, fullname, account.phone_number, account.role_id]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createUser() query:', error);
            throw error;
        }
    }

    static async getUsers(keyword = '', page = 1, additionalConditions = {}, usersPerPage = 15) {
        keyword = diacritics.remove(keyword);
        const offset = (page - 1) * usersPerPage;
    
        // Mảng điều kiện và giá trị
        const conditions = [
            '(LOWER(u.username) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.phone_number) LIKE LOWER(?) OR LOWER(u.fullname) LIKE LOWER(?))'
        ];
        const values = [
            `%${keyword}%`,  // Tìm theo tên người dùng
            `%${keyword}%`,  // Tìm theo email người dùng
            `%${keyword}%`,  // Tìm theo số điện thoại người dùng
            `%${keyword}%`   // Tìm theo họ tên người dùng
        ];
    
        // Xử lý các điều kiện bổ sung dựa trên additionalConditions
        let isViolationCondition = ''; // Điều kiện cho is_violation
    
        Object.keys(additionalConditions).forEach((key) => {
            const value = additionalConditions[key];
            if (value !== null && value !== undefined) {
                if (key === 'is_violation') {
                    // Điều kiện cho is_violation
                    if (value === 1) {
                        isViolationCondition = `
                            EXISTS (
                                SELECT 1 FROM user_disables ud 
                                WHERE ud.user_id = u.user_id
                                AND ud.disable_end > NOW()
                                AND ud.is_active = 1
                            )
                        `;
                    } else if (value === 0) {
                        isViolationCondition = `
                            NOT EXISTS (
                                SELECT 1 FROM user_disables ud 
                                WHERE ud.user_id = u.user_id
                                AND ud.disable_end > NOW()
                                AND ud.is_active = 1
                            )
                        `;
                    }
                } else {
                    conditions.push(`u.${key} = ?`);
                    values.push(value);
                }
            }
        });
    
        // Thêm điều kiện cho is_violation nếu có
        if (isViolationCondition) {
            conditions.push(isViolationCondition);
        } else {
            // Nếu không có điều kiện is_violation thì mặc định lấy các người dùng không bị vô hiệu hóa
            conditions.push(`
                NOT EXISTS (
                    SELECT 1 FROM user_disables ud 
                    WHERE ud.user_id = u.user_id
                    AND ud.disable_end > NOW()
                    AND ud.is_active = 1
                )
            `);
        }
    
        // Truy vấn số lượng người dùng
        const countQueryString = `
            SELECT COUNT(u.user_id) AS total_count
            FROM users u
            WHERE ${conditions.join(' AND ')}
        `;
    
        // Truy vấn danh sách người dùng
        const queryString = `
            SELECT
                u.user_id, u.username, u.fullname, u.email, u.phone_number, 
                u.avatar_url, r.name AS role_name, u.created_at, u.updated_at
            FROM users u
            JOIN roles r ON r.role_id = u.role_id
            WHERE ${conditions.join(' AND ')}
            LIMIT ${usersPerPage}
            OFFSET ${offset}
        `;
    
        try {
            // Đếm tổng số người dùng
            const [countRows] = await pool.execute(countQueryString, values);
            const totalCount = countRows[0].total_count;
            const totalPages = Math.ceil(totalCount / usersPerPage);
    
            // Lấy danh sách người dùng
            const [rows] = await pool.execute(queryString, values);
    
            return { users: rows, totalPages }; // Trả về dữ liệu người dùng và tổng số trang
        } catch (error) {
            console.error('Error executing getUsers() query:', error);
            throw error;
        }
    }     

    static async getUserById(user_id) {
        const queryString = `
        SELECT 
            u.user_id, u.username, u.fullname, u.email, u.phone_number, u.last_activity,
            u.gender, u.date_of_birth, u.avatar_url, u.role_id, 
            r.name as role_name, 
            u.is_email_verified, u.is_phone_verified, u.is_active, u.refresh_token,
            u.created_at, u.updated_at
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getUserById() query:', error);
            throw error;
        }
    }

    static async getUserByUsernameOrPhoneNumber(keyword) {
        const queryString = `
        SELECT *
        FROM users
        WHERE
            username = ?
            OR phone_number = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [keyword, keyword]);
            
            return rows[0];
        } catch (error) {
            console.error('Error executing getUserByUsernameOrPhoneNumber() query:', error);
            throw error;
        }
    }

    static async updateUser(account) {
        // Xây dựng câu lệnh SQL
        let setClause = [];
        let values = [];
        
        // Duyệt qua các key của account để xây dựng câu lệnh SQL
        for (const [key, value] of Object.entries(account)) {
            if (key === 'user_id') continue; // Bỏ qua trường user_id ở đây
            setClause.push(`${key} = ?`);
            values.push(value);
        }

        // Thêm ID của người dùng vào cuối cùng
        setClause = setClause.join(', ');
        const queryString = `
            UPDATE users
            SET ${setClause}
            WHERE user_id = ?
        `;

        values.push(account.user_id); // Thêm user_id vào cuối mảng values

        try {
            const [result] = await pool.execute(queryString, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateUser() query:', error);
            throw error;
        }
    }

    static async deleteUser(user_id) {
        const queryString = `
        DELETE FROM users
        WHERE user_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [user_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing deleteUser() query:', error);
            throw error;
        }
    }

    // ---------------------------
    // address
    // ---------------------------
    static async createAddress(address, user_id) {
        const queryString = `
            INSERT INTO address (user_id, receiver_name, city, district, ward, detail, phone_number, address_type, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
            const [result] = await pool.execute(queryString, [
                user_id,
                address.receiver_name,
                address.city,
                address.district,
                address.ward,
                address.detail,
                address.phone_number,
                address.address_type,
                0
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Error executing getUserById() query:', error);
            throw error;
        }
    }

    static async getAddressByUserId(user_id) {
        const queryString = `
            SELECT *
            FROM address
            WHERE user_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id]);
            return rows;
        } catch (error) {
            console.error('Error executing getUserById() query:', error);
            throw error;
        }
    }

    static async getAddressById(address_id) {
        const queryString = `
            SELECT *
            FROM address
            WHERE address_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [address_id]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getUserById() query:', error);
            throw error;
        }
    }

    static async updateAddress(address, user_id) {
        // Xây dựng câu lệnh SQL
        let setClause = [];
        let values = [];
    
        // Duyệt qua các key của address để xây dựng câu lệnh SQL
        for (const [key, value] of Object.entries(address)) {
            if (key == 'address_id') continue; // Bỏ qua trường address_id ở đây
            setClause.push(`${key} = ?`);
            values.push(value);
        }
    
        // Thêm ID của địa chỉ vào cuối cùng
        setClause = setClause.join(', ');
        const queryString = `
            UPDATE address
            SET ${setClause}
            WHERE address_id = ? AND user_id = ?
        `;

        if (address.is_default && address.is_default == 1) {
            const resetQuery = `
                UPDATE address
                SET is_default = 0
                WHERE user_id = ? AND address_id != ?
            `;
            await pool.execute(resetQuery, [user_id, address.address_id]);
        }
    
        values.push(address.address_id); // Thêm address_id vào cuối mảng values
        values.push(user_id);

        try {
            const [result] = await pool.execute(queryString, values);
            return result.affectedRows > 0; // Trả về true nếu cập nhật thành công
        } catch (error) {
            console.error('Error executing updateAddress() query:', error);
            throw error;
        }
    }

    static async deleteAddress(address_id, user_id) {
        const queryString = `
            DELETE FROM address
            WHERE address_id = ? AND user_id = ?
        `;
    
        try {
            const [result] = await pool.execute(queryString, [address_id, user_id]);
            return result.affectedRows > 0; // Trả về true nếu xóa thành công
        } catch (error) {
            console.error('Error executing deleteAddress() query:', error);
            throw error;
        }
    }


    // Tạo một bản ghi vô hiệu hóa người dùng
    static async createUserDisable({ user_id, disable_end, reason, note, created_by }) {
        const queryString = `
            INSERT INTO user_disable (user_id, disable_end, reason, note, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;

        try {
            const [result] = await pool.execute(queryString, [user_id, disable_end, reason, note, created_by]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createUserDisable() query:', error);
            throw error;
        }
    }

    // Cập nhật một bản ghi vô hiệu hóa
    static async updateUserDisable({ user_disable_id, disable_end, reason, note, updated_by }) {
        const queryString = `
            UPDATE user_disable
            SET
                disable_end = COALESCE(?, disable_end),
                reason = COALESCE(?, reason),
                note = COALESCE(?, note),
                updated_by = COALESCE(?, updated_by),
                updated_at = NOW()
            WHERE
                user_disable_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [disable_end, reason, note, updated_by, user_disable_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateUserDisable() query:', error);
            throw error;
        }
    }

    // Lấy thông tin vô hiệu hóa của một người dùng
    static async getUserDisableByUserId(user_id) {
        const queryString = `
            SELECT
                user_disable_id, user_id, disable_end, reason, note, created_by, created_at, updated_by, updated_at
            FROM
                user_disable
            WHERE
                user_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id]);
            return rows;
        } catch (error) {
            console.error('Error executing getUserDisableByUserId() query:', error);
            throw error;
        }
    }

    // Lấy thông tin vô hiệu hóa còn hiệu lực của một người dùng
    static async getCurrentDisableByUserId(user_id) {
        const currentTime = new Date();

        const queryString = `
            SELECT *
            FROM user_disables
            WHERE user_id = ?
            AND disable_end > ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [user_id, currentTime]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getCurrentDisableByUserId() query:', error);
            throw error;
        }
    }

    // Xóa thông tin vô hiệu hóa của một người dùng
    static async deleteUserDisable(user_disable_id) {
        const queryString = `
            DELETE FROM user_disable
            WHERE
                user_disable_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [user_disable_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing deleteUserDisable() query:', error);
            throw error;
        }
    }
}

module.exports = UserModel;
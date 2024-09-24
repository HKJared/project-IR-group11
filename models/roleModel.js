const pool = require('../configs/connectDB');

class RoleModel {
    // Lấy tất cả các vai trò
    static async getAllRoles() {
        const queryString = `
            SELECT
                role_id, name
            FROM
                roles
        `;

        try {
            const [rows] = await pool.execute(queryString);
            return rows;
        } catch (error) {
            console.error('Error executing getAllRoles() query:', error);
            throw error;
        }
    }

    // Lấy thông tin của một vai trò theo ID
    static async getRoleById(role_id) {
        const queryString = `
            SELECT
                role_id, name
            FROM
                roles
            WHERE
                role_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [role_id]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getRoleById() query:', error);
            throw error;
        }
    }

    // Tạo một vai trò mới
    static async createRole(name) {
        const queryString = `
            INSERT INTO roles (name)
            VALUES (?)
        `;

        try {
            const [result] = await pool.execute(queryString, [name]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createRole() query:', error);
            throw error;
        }
    }

    // Cập nhật thông tin của một vai trò
    static async updateRole(role_id, newName) {
        const queryString = `
            UPDATE roles
            SET name = ?
            WHERE role_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [newName, role_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing updateRole() query:', error);
            throw error;
        }
    }

    // Xóa một vai trò
    static async deleteRole(role_id) {
        const queryString = `
            DELETE FROM roles
            WHERE role_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [role_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing deleteRole() query:', error);
            throw error;
        }
    }

    // Lấy các quyền hạn của một vai trò
    static async getPermissionsByRoleId(role_id) {
        const queryString = `
            SELECT
                p.permission_id, p.name
            FROM
                role_permissions rp
            JOIN
                permissions p ON rp.permission_id = p.permission_id
            WHERE
                rp.role_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [role_id]);
            return rows;
        } catch (error) {
            console.error('Error executing getPermissionsByRoleId() query:', error);
            throw error;
        }
    }

    // Thêm quyền hạn cho một vai trò
    static async addPermissionToRole(role_id, permission_id) {
        const queryString = `
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
        `;

        try {
            const [result] = await pool.execute(queryString, [role_id, permission_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing addPermissionToRole() query:', error);
            throw error;
        }
    }

    // Xóa quyền hạn khỏi một vai trò
    static async removePermissionFromRole(role_id, permission_id) {
        const queryString = `
            DELETE FROM role_permissions
            WHERE role_id = ? AND permission_id = ?
        `;

        try {
            const [result] = await pool.execute(queryString, [role_id, permission_id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error executing removePermissionFromRole() query:', error);
            throw error;
        }
    }
}

module.exports = RoleModel;
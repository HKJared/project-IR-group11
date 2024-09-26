const pool = require('../configs/connectDB'); // Đảm bảo bạn đã cấu hình pool kết nối DB

class ItemModel {
    // Hàm thêm project từ thư mục uploads vào DB
    static async addProjectsFromUploads(directory) {
        const projects = fs.readdirSync(directory);

        for (const project of projects) {
            const projectPath = path.join(directory, project);
            const stat = fs.statSync(projectPath);

            if (stat.isDirectory()) {
                // Thêm item
                const itemId = await this.createItem(project, 'Mô tả cho project'); // Có thể chỉnh sửa mô tả

                // Thêm folder và files
                await this.addFolderAndFiles(itemId, projectPath);
            }
        }
    }

    // Tạo một item mới
    static async createItem(title, description) {
        const queryString = `
            INSERT INTO items (title, description)
            VALUES (?, ?)
        `;

        try {
            const [result] = await pool.execute(queryString, [title, description]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createItem() query:', error);
            throw error;
        }
    }

    // Thêm folder và files
    static async addFolderAndFiles(itemId, folderPath) {
        const folderName = path.basename(folderPath);
        const folderId = await this.createFolder(itemId, folderName);

        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile()) {
                await this.createFile(itemId, folderId, filePath);
            } else if (stat.isDirectory()) {
                await this.addFolderAndFiles(itemId, filePath); // Gọi đệ quy cho thư mục con
            }
        }
    }

    // Tạo folder mới
    static async createFolder(itemId, name) {
        const queryString = `
            INSERT INTO folders (item_id, name)
            VALUES (?, ?)
        `;

        try {
            const [result] = await pool.execute(queryString, [itemId, name]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createFolder() query:', error);
            throw error;
        }
    }

    // Tạo file mới
    static async createFile(itemId, folderId, filePath) {
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileSize = fs.statSync(filePath).size;

        const queryString = `
            INSERT INTO files (item_id, folder_id, name, content, size)
            VALUES (?, ?, ?, ?, ?)
        `;

        try {
            await pool.execute(queryString, [itemId, folderId, fileName, fileContent, fileSize]);
        } catch (error) {
            console.error('Error executing createFile() query:', error);
            throw error;
        }
    }

    // Lấy thông tin item theo ID
    static async getItemById(itemId) {
        const queryString = `
            SELECT *
            FROM items
            WHERE id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [itemId]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getItemById() query:', error);
            throw error;
        }
    }

    static async getFolderById(folderId) {
        const queryString = `
            SELECT *
            FROM folders
            WHERE id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [folderId]);
            return rows[0];
        } catch (error) {
            console.error('Error executing getFolderById() query:', error);
            throw error;
        }
    }

    // Lấy danh sách folders theo item ID
    static async getFoldersByItemId(itemId) {
        const queryString = `
            SELECT *
            FROM folders
            WHERE item_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [itemId]);
            return rows;
        } catch (error) {
            console.error('Error executing getFoldersByItemId() query:', error);
            throw error;
        }
    }

    // Lấy danh sách files theo item ID
    static async getFilesByItemId(itemId) {
        const queryString = `
            SELECT *
            FROM files
            WHERE item_id = ?
        `;

        try {
            const [rows] = await pool.execute(queryString, [itemId]);
            return rows;
        } catch (error) {
            console.error('Error executing getFilesByItemId() query:', error);
            throw error;
        }
    }
}

module.exports = ItemModel;

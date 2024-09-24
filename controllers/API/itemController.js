const ItemModel = require('../../models/itemModel'); // Import model
const fs = require('fs');
const path = require('path');

class ItemController {
    // Hàm nạp project từ thư mục uploads vào DB
    static async importProjects(req, res) {
        const uploadsDir = path.join(__dirname, '../uploads');

        try {
            await ItemModel.addProjectsFromUploads(uploadsDir);
            res.status(200).json({ message: 'Projects imported successfully!' });
        } catch (error) {
            console.error('Error importing projects:', error);
            res.status(500).json({ message: 'Error importing projects', error });
        }
    }
}

module.exports = ItemController;

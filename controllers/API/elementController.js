const fs = require('fs');
const path = require('path');

class ElementController {
    static async getStoreMainElement(req, res) {
        try {
            const partial = req.params.partial;
            const filePath = path.join(__dirname, '../../views/store/partials', `${partial}.ejs`);
        
            // Kiểm tra xem file có tồn tại không
            if (fs.existsSync(filePath)) {
                return res.status(200).render(`store/partials/${partial}`);
            } else {
                return res.status(200).render('page-not-found');
            }
        } catch (error) {
            console.error('Error at getStoreMainElement():', error);
            return res.status(500).send('Server error');
        }
    }

    static async getUserMainElement(req, res) {
        try {
            const partial = req.params.partial;
            
            const filePath = path.join(__dirname, '../../views/client/partials', `${partial}.ejs`);
        
            // Kiểm tra xem file có tồn tại không
            if (fs.existsSync(filePath)) {
                return res.status(200).render(`client/partials/${partial}`);
            } else {
                return res.status(200).render('page-not-found');
            }
        } catch (error) {
            console.error('Error at getUserMainElement():', error);
            return res.status(500).send('Server error');
        }
    }

    static async getUserSubElement(req, res) {
        try {
            const partial = req.params.partial;
            const sub_partial = req.params.sub_partial;
            const filePath = path.join(__dirname, `../../views/client/partials/${ partial }-partials`, `${sub_partial}.ejs`);
        
            // Kiểm tra xem file có tồn tại không
            if (fs.existsSync(filePath)) {
                return res.status(200).render(`client/partials/${ partial }-partials/${ sub_partial }`);
            } else {
                return res.status(200).render('page-not-found');
            }
        } catch (error) {
            console.error('Error at getUserMainElement():', error);
            return res.status(500).send('Server error');
        }
    }

    static async getAdminMainElement(req, res) {
        try {
            const partial = req.params.partial;
            const filePath = path.join(__dirname, '../../views/admin/partials', `${partial}.ejs`);
        
            // Kiểm tra xem file có tồn tại không
            if (fs.existsSync(filePath)) {
                return res.status(200).render(`admin/partials/${partial}`);
            } else {
                return res.status(200).render('page-not-found');
            }
        } catch (error) {
            console.error('Error at getAdminMainElement():', error);
            return res.status(500).send('Server error');
        }
    }
}

module.exports = ElementController;
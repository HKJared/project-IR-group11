const ItemModel = require('../../models/itemModel'); // Import model
const fs = require('fs');
const path = require('path');
const { initializeElastic, esClient } = require('../../utils/setupElasticsearch');

class examController {
    static async search(req, res) {
        try {
            const { keyword = '', page = 1, items_per_page = 10 } = req.query;

            // Chuyển đổi tham số `page` và `items_per_page` thành số
            const pageNumber = parseInt(page, 10);
            const itemsPerPage = parseInt(items_per_page, 10);

            // Tính toán vị trí bắt đầu
            const from = (pageNumber - 1) * itemsPerPage;

            // Thực hiện tìm kiếm trên nhiều trường
            const response = await esClient.search({
                index: 'exams',
                body: {
                    from, // Vị trí bắt đầu
                    size: itemsPerPage, // Số lượng kết quả trên mỗi trang
                    query: {
                        bool: {
                            should: [
                                { match: { title: keyword } },
                                { match: { code: keyword } },
                                { match: { description: keyword } }
                            ]
                        }
                    }
                }
            });

            const exams = response.hits.hits.map(hit => ({
                id: hit._id,
                ...hit._source,
            }));

            // Trả về kết quả cùng với thông tin phân trang
            res.status(200).json({
                total: response.hits.total.value,
                page: pageNumber,
                items_per_page: itemsPerPage,
                exams,
            });
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    }
}


module.exports = examController;

const ItemModel = require('../../models/itemModel'); // Import model
const fs = require('fs');
const path = require('path');
const { initializeElastic, esClient } = require('../../utils/setupElasticsearch');
// const { initializeElastic, esClient } = require('../../utils/setupElasticsearchEL');

class examController {
    static async search(req, res) {
        try {
            const { keyword = '', page = 1, items_per_page = 10 } = req.query;
    
            // Chuyển đổi tham số `page` và `items_per_page` thành số
            const pageNumber = parseInt(page, 10);
            const itemsPerPage = parseInt(items_per_page, 10);
    
            // Tính toán vị trí bắt đầu
            const from = (pageNumber - 1) * itemsPerPage;
    
            // Định nghĩa truy vấn
            let query;
    
            if (keyword.trim() === '') {
                // Trả về tất cả tài liệu khi không có từ khóa
                query = {
                    match_all: {}
                };
            } else {
                // Thực hiện tìm kiếm với keyword đã chuẩn hóa
                query = {
                    bool: {
                        should: [                            
                            { match: { title: keyword } },
                            { match: { description: keyword } },
                            { match: { code: keyword } },
                            { match: { 'title_no_accent': keyword } },
                            { match: { 'description_no_accent': keyword } },
                            { match: { 'code_no_accent': keyword } },
                            { match: { 'title_bigram': keyword } },
                            { match: { 'description_bigram': keyword } },
                            { match: { 'code_bigram': keyword } },
                            { match: { combined_field: keyword } }, // Truy vấn vào trường kết hợp
                        ]
                    }
                };
            }
    
            // Thực hiện tìm kiếm
            const response = await esClient.search({
                index: 'exams',
                body: {
                    from, // Vị trí bắt đầu
                    size: itemsPerPage, // Số lượng kết quả trên mỗi trang
                    query: query // Sử dụng truy vấn đã định nghĩa
                }
            });
    
            const exams = response.hits.hits.map(hit => ({
                id: hit._id,
                ...hit._source,
            }));
    
            // Tính toán tổng số trang
            const totalItems = response.hits.total.value; // Tổng số mục
            const totalPages = Math.ceil(totalItems / itemsPerPage); // Tổng số trang
    
            // Trả về kết quả cùng với thông tin phân trang
            res.status(200).json({
                total_page: totalPages,
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

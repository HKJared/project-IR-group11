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
    
            // tìm trong table keywords xem có k.val = keyword không, nếu có thì count total_search, nếu không thì tạo mới với total_search = 1

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
                            // { match: { 'title_no_accent': keyword } },
                            // { match: { 'description_no_accent': keyword } },
                            // { match: { 'code_no_accent': keyword } },
                            // { match: { 'title_bigram': keyword } },
                            // { match: { 'description_bigram': keyword } },
                            // { match: { 'code_bigram': keyword } },
                            // { match: { combined_field: keyword } }, // Truy vấn vào trường kết hợp
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
                    query: query, // Sử dụng truy vấn đã định nghĩa
                    explain: true
                }
            });
    
            // Lấy dữ liệu từ kết quả tìm kiếm, bao gồm cả _score
            const exams = response.hits.hits.map(hit => ({
                id: hit._id,
                ...hit._source,
                score: hit._score,
                explanation_details: hit._explanation.details,
            }));
    
            // Tính toán tổng số trang
            const totalItems = response.hits.total.value; // Tổng số mục
            const totalPages = Math.ceil(totalItems / itemsPerPage); // Tổng số trang
    
            // Trả về kết quả cùng với thông tin phân trang và điểm xếp hạng
            res.status(200).json({
                total_page: totalPages,
                page: pageNumber,
                items_per_page: itemsPerPage,
                exams, // Kết quả đã bao gồm score
            });
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    }    
    
    static async getExamById(req, res) {
        try {
            const id = req.query.id;
    
            if (!id) {
                return res.status(400).json({ message: 'Không nhận được ID.' });
            }
    
            // Thực hiện tìm kiếm bằng ID trong Elasticsearch
            const response = await esClient.search({
                index: 'exams',
                body: {
                    query: {
                        term: {
                            _id: id  // Tìm kiếm chính xác bằng ID
                        }
                    }
                }
            });
    
            if (response.hits.total.value === 0) {
                return res.status(404).json({ message: 'Không tìm thấy tài liệu với ID này.' });
            }
    
            // Lấy dữ liệu từ kết quả tìm kiếm
            const exam = response.hits.hits[0]._source;
            exam.id = id;
    
            // Trả về kết quả
            res.status(200).json({
                exam: exam
            });
    
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Có lỗi xảy ra.' });
        }
    }
}


module.exports = examController;

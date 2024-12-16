const ItemModel = require('../../models/itemModel'); // Import model
const fs = require('fs');
const path = require('path');
// const { initializeElastic, esClient } = require('../../utils/setupElasticsearch');
const { initializeElastic, esClient } = require('../../utils/setupElasticsearchMultiFile');
// const { initializeElastic, esClient } = require('../../utils/setupElasticsearchEL');

class examController {

    static async search(req, res) {
        try {
            const { keyword = '', page = 1, items_per_page = 10, index_names = '[]' } = req.query;
    
            // Chuyển đổi `index_names` thành mảng (do chuỗi JSON gửi từ client)
            const indices = JSON.parse(index_names);
    
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
                const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const keywordNoAccent = removeAccents(keyword);
                // Truy vấn tìm kiếm trên tất cả các trường
                // query = {
                //     multi_match: {
                //         query: keyword,
                //         fields: ['*'], // Tìm kiếm trên tất cả các trường trong index
                        
                //     }
                // };
                query = {
                    bool: {
                        should: [
                            {
                                dis_max: {
                                    queries: [
                                        {
                                            multi_match: {
                                                query: keyword,
                                                type: "phrase",
                                                fields: ["*^10"]
                                            }
                                        },
                                        {
                                            multi_match: {
                                                query: keyword,
                                                operator: "and",
                                                fields: ["*^5"]
                                            }
                                        },
                                        {
                                            multi_match: {
                                                query: keywordNoAccent,
                                                type: "phrase",
                                                fields: ["*^3"]
                                            }
                                        },
                                        {
                                            multi_match: {
                                                query: keywordNoAccent,
                                                fields: ["*^1"]
                                            }
                                        },
                                        {
                                            multi_match: {
                                                query: keyword,
                                                fields: ['*'], // Tìm kiếm trên tất cả các trường trong index
                                                
                                            }
                                        }
                                    ]
                                }
                            }
                        ],
                        minimum_should_match: 1
                    }
                }
            }
    
            // Chọn index để tìm kiếm
            const indexToSearch = indices.length > 0 ? indices.join(',') : '*'; // Nếu không có index_names thì tìm kiếm toàn cục
    
            // Thực hiện tìm kiếm
            const response = await esClient.search({
                index: indexToSearch, // Tìm kiếm theo chỉ mục cụ thể hoặc toàn bộ
                body: {
                    from, // Vị trí bắt đầu
                    size: itemsPerPage, // Số lượng kết quả trên mỗi trang
                    query: query, // Sử dụng truy vấn đã định nghĩa
                    explain: true // Giải thích điểm số
                }
            });
    
            // Lấy dữ liệu từ kết quả tìm kiếm, bao gồm cả _score và _index
            const exams = response.hits.hits.map(hit => ({
                id: hit._id,
                index_name: hit._index, // Thêm tên chỉ mục
                ...hit._source,
                score: hit._score,
                explanation_details: hit._explanation ? hit._explanation.details : null,
            }));
    
            // Tính toán tổng số trang
            const totalItems = response.hits.total.value; // Tổng số mục
            const totalPages = Math.ceil(totalItems / itemsPerPage); // Tổng số trang
    
            // Trả về kết quả cùng với thông tin phân trang và điểm xếp hạng
            res.status(200).json({
                total_page: totalPages,
                page: pageNumber,
                items_per_page: itemsPerPage,
                exams, // Kết quả đã bao gồm score và index_name
            });
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    }
    
    // static async getExamById(req, res) {
    //     try {
    //         const id = req.query.id;
    
    //         if (!id) {
    //             return res.status(400).json({ message: 'Không nhận được ID.' });
    //         }
    
    //         // Thực hiện tìm kiếm bằng ID trong Elasticsearch
    //         const response = await esClient.search({
    //             index: 'exams',
    //             body: {
    //                 query: {
    //                     term: {
    //                         _id: id  // Tìm kiếm chính xác bằng ID
    //                     }
    //                 }
    //             }
    //         });
    
    //         if (response.hits.total.value === 0) {
    //             return res.status(404).json({ message: 'Không tìm thấy tài liệu với ID này.' });
    //         }
    
    //         // Lấy dữ liệu từ kết quả tìm kiếm
    //         const exam = response.hits.hits[0]._source;
    //         exam.id = id;
    
    //         // Trả về kết quả
    //         res.status(200).json({
    //             exam: exam
    //         });
    
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ message: 'Có lỗi xảy ra.' });
    //     }
    // }
    
    static async getExamById(req, res) {// TODO: mutil detail
        try {
            const id = req.query.id;
    
            if (!id) {
                return res.status(400).json({ message: 'Không nhận được ID.' });
            }
    
            // Thực hiện tìm kiếm bằng ID trong tất cả các chỉ mục
            const response = await esClient.search({
                index: '*',  // Tìm kiếm trong tất cả các chỉ mục
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
    

    static async getIndexNames(req, res) {
        try {
            const response = await esClient.cat.indices({
                format: 'json' // Trả về kết quả dưới dạng JSON
            });
    
            // Lấy danh sách các index_name từ kết quả
            const indices = response.map(index => index.index);

            return res.status(200).json({ index_names: indices })
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Có lỗi xảy ra.' });
        }
    }
}


module.exports = examController;

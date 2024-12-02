const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const dataPath = path.resolve(__dirname, '../seeds/nhom11_data.json');
const data = fs.readFileSync(dataPath, 'utf-8');

const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const toLowerCase = (str) => {
    return str.toLowerCase();
};

const generateBigrams = (str) => {
    const tokens = str.split(/\s+/);
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.push(tokens[i] + ' ' + tokens[i + 1]);
    }
    return bigrams.join(' ');
};

const processDocument = (doc) => {
    const combined = `${doc.title} ${doc.description}`;
    return {
        ...doc,
        title_lower: toLowerCase(doc.title),
        title_no_accents: removeAccents(doc.title),
        title_bigrams: generateBigrams(doc.title),
        description_lower: toLowerCase(doc.description),
        description_no_accents: removeAccents(doc.description),
        description_bigrams: generateBigrams(doc.description),
        combined_field: combined, // Lưu trường kết hợp
    };
};

// Kết nối Elasticsearch
const esClient = new Client({
    node: 'http://localhost:9200',
    auth: {
        username: 'elastic',
        password: process.env.ELASTIC_PASSWORD,
    },
});

// Hàm tạo index với các trường cần thiết
const createExamsIndex = async () => {
    const indexName = 'exams';

    try {
        const exists = await esClient.indices.exists({ index: indexName });
        console.log(`Index "${indexName}" exists: ${exists}`);

        // Xóa index cũ nếu tồn tại
        if (exists) {
            const deleteResponse = await esClient.indices.delete({ index: indexName });
            console.log(`Index "${indexName}" deleted.`, deleteResponse);
        } else {
            console.log(`Index "${indexName}" does not exist.`);
        }

        // Tạo mới index với settings
        const createResponse = await esClient.indices.create({
            index: indexName,
            body: {
                settings: {
                    index: {
                        number_of_shards: 3, // Số lượng phân mảnh
                        number_of_replicas: 1, // Số lượng bản sao
                    },
                    analysis: {
                        filter: {
                            my_stop: {
                                type: "stop",
                                stopwords: ["hãy", "để", "các", "từ", "tới", "có", "hoặc", "không", "nếu", "cho", "người", "tìm", "và", "lập", "trình"] // Danh sách từ dừng
                            }
                        },
                        analyzer: {
                            my_custom_analyzer: { // Custom analyzer
                                type: "custom",
                                tokenizer: "standard",
                                filter: ["lowercase", "asciifolding", "my_stop"], // Thêm filter my_stop
                            },
                            // scientific_analyzer: {
                            //     type: "custom",
                            //     tokenizer: "standard",
                            //     filter: ["lowercase"], // Analyzer khác có thể không sử dụng stop words
                            // }
                        },
                    },
                },
                mappings: {
                    properties: {
                        description: { type: 'text', analyzer: 'my_custom_analyzer' },
                        title: { type: 'text', analyzer: 'my_custom_analyzer' },
                        code: { type: 'keyword' },
                        // title_lower: { type: 'text', analyzer: 'standard' },
                        // title_bigrams: { type: 'text', analyzer: 'standard' },
                        // description_lower: { type: 'text', analyzer: 'standard' },
                        // description_bigrams: { type: 'text', analyzer: 'standard' },
                        combined_field: { // Trường kết hợp
                            type: 'text',
                            fields: {
                                raw: { type: 'keyword' },
                            },
                        },
                    },
                },
            },
        });

        console.log(`Index "${indexName}" created with settings.`, createResponse);
    } catch (error) {
        console.error(`Error creating index: ${error}`);
    }
};

// Hàm nạp dữ liệu vào index
const indexData = async () => {
    try {
        // Đọc dữ liệu từ tệp JSON
        const parsedData = JSON.parse(data);

        // Xử lý từng tài liệu trong dữ liệu
        const processedData = parsedData.map(doc => processDocument(doc));

        // Chuẩn bị body cho bulk API
        const body = processedData.flatMap(doc => [
            { index: { _index: 'exams' } }, // Metadata
            doc // Dữ liệu đã qua xử lý cần nạp
        ]);

        // Gọi API bulk của Elasticsearch để nạp dữ liệu
        const bulkResponse = await esClient.bulk({ refresh: true, body });

        // Kiểm tra nếu bulkResponse đã được định nghĩa
        if (bulkResponse && bulkResponse.body) {
            if (bulkResponse.body.errors) {
                const erroredDocuments = [];
                bulkResponse.body.items.forEach((action, i) => {
                    const operation = Object.keys(action)[0];
                    if (action[operation].error) {
                        erroredDocuments.push({
                            status: action[operation].status,
                            error: action[operation].error,
                            document: body[i * 2 + 1],
                        });
                    }
                });
                console.log('Errors occurred:', erroredDocuments);
            } else {
                console.log('Data indexed successfully!');
            }
        } else {
            // console.error('Bulk response is undefined or invalid:', bulkResponse);
        }
    } catch (error) {
        console.error(`Error indexing data: ${error}`);
    }
};

// Hàm khởi động Elasticsearch và nạp dữ liệu
const initializeElastic = async () => {
    console.log('Starting Elasticsearch initialization...');

    await createExamsIndex();
    await indexData();

    console.log('Elasticsearch initialization completed.');
};


module.exports = {
    esClient,
    initializeElastic,
};

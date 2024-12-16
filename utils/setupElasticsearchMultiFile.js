const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Kết nối Elasticsearch
const esClient = new Client({
    node: 'http://localhost:9200',
    auth: {
        username: 'elastic',
        password: process.env.ELASTIC_PASSWORD,
    },
});

// Xác định thư mục chứa các file JSON
const seedsDir = path.resolve(__dirname, '../seeds');

// Hàm sinh mapping động
const generateMapping = (sample) => {
    const inferType = (value) => {
        if (typeof value === 'string') return { type: 'text' }; // Xử lý chuỗi
        if (typeof value === 'number') return Number.isInteger(value) ? { type: 'integer' } : { type: 'float' }; // Xử lý số nguyên và số thực
        if (typeof value === 'boolean') return { type: 'boolean' }; // Xử lý boolean
        if (Array.isArray(value)) {
            // Nếu là mảng, chuyển thành chuỗi để tìm kiếm dễ dàng hơn
            return { type: 'keyword' }; // Chuyển tất cả mảng về kiểu keyword (chuỗi)
        }
        if (typeof value === 'object') {
            // Nếu là đối tượng, chuyển thành chuỗi JSON để tìm kiếm dễ dàng hơn
            return { type: 'keyword' }; // Chuyển đối tượng thành chuỗi JSON
        }
        return { type: 'keyword' }; // Các kiểu dữ liệu khác mặc định là keyword
    };

    const properties = {};
    for (const key in sample) {
        properties[key] = inferType(sample[key]);
    }
    return properties;
};

// Hàm tạo index với mapping động
const createIndex = async (indexName, sampleData) => {
    try {
        const exists = await esClient.indices.exists({ index: indexName });
        if (exists) await esClient.indices.delete({ index: indexName });

        const mapping = {
            properties: generateMapping(sampleData),
        };

        await esClient.indices.create({
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
                mappings: mapping,
            },
        });

        console.log(`Index "${indexName}" created successfully.`);
    } catch (error) {
        console.error(`Error creating index "${indexName}":`, error);
    }
};

// Hàm nạp dữ liệu
const indexData = async (indexName, data) => {
    try {
        const body = data.flatMap(doc => [{ index: { _index: indexName } }, doc]);
        const response = await esClient.bulk({ refresh: true, body });

        if (response.errors) {
            console.error(`Errors occurred while indexing data for "${indexName}":`, response.items);
        } else {
            console.log(`Data indexed successfully for "${indexName}".`);
        }
    } catch (error) {
        console.error(`Error indexing data for "${indexName}":`, error);
    }
};

// Hàm xử lý toàn bộ file JSON trong thư mục
const processAllFiles = async () => {
    const files = fs.readdirSync(seedsDir).filter(file => file.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(seedsDir, file);
        const indexName = path.basename(file, '.json');

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            if (Array.isArray(data) && data.length > 0) {
                const sampleData = data[0];

                await createIndex(indexName, sampleData);
                await indexData(indexName, data);
            } else {
                console.warn(`File "${file}" does not contain valid array data.`);
            }
        } catch (error) {
            console.error(`Error processing file "${file}":`, error);
        }
    }
};

// Khởi động xử lý
const initializeElastic = async () => {
    console.log('Starting Elasticsearch initialization...');
    await processAllFiles();
    console.log('Elasticsearch initialization completed.');
};

module.exports = {
    esClient,
    initializeElastic,
};
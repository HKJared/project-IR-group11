const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const dataPath = path.resolve(__dirname, '../seeds/data.json');
const data = fs.readFileSync(dataPath, 'utf-8');

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

        // Tạo mới index
        const createResponse = await esClient.indices.create({
            index: indexName,
            body: {
                mappings: {
                    properties: {
                        title: { type: 'text' },
                        description: { type: 'text' },
                        html_url: { type: 'text' },
                        language: { type: 'text' },
                    },
                },
            },
        });

        console.log(`Index "${indexName}" created.`, createResponse);
    } catch (error) {
        console.error(`Error creating index: ${error}`);
    }
};

// Hàm nạp dữ liệu vào index
const indexData = async () => {
    try {
        // Đọc dữ liệu từ tệp JSON
        const parsedData = JSON.parse(data);

        // Chuẩn bị body cho bulk API
        const body = parsedData.flatMap(doc => [
            { index: { _index: 'exams' } }, // Metadata
            doc // Dữ liệu cần nạp
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
            console.error('Bulk response is undefined or invalid:', bulkResponse);
        }
    } catch (error) {
        console.error(`Error indexing data: ${error}`);
    }
};

// Hàm khởi động Elasticsearch và nạp dữ liệu
const initializeElastic = async () => {
    await createExamsIndex();
    await indexData();
};

module.exports = {
    esClient,
    initializeElastic,
};

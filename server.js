const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

// Tạo kết nối tới Elasticsearch
const esClient = new Client({
    node: 'http://localhost:9200',
    auth: {
      username: 'elastic',
      password: process.env.ELASTIC_PASSWORD, // Thay thế bằng mật khẩu đã tạo
    },
  });

// Kiểm tra kết nối
esClient.ping()
  .then(() => console.log('Elasticsearch connected!'))
  .catch(err => console.error('Elasticsearch connection failed:', err));

const configViewEngine = require('./configs/viewEngine');

//api router
const adminApiRouter = require('./routes/API/adminRouter');
const userApiRouter = require('./routes/API/userRouter');

//web router
const userWebRouter = require('./routes/WEB/userRouter');
const adminWebRouter = require('./routes/WEB/adminRouter');

const app = express();

const port = process.env.PORT || 8080;

// Cấu hình CORS
const corsOptions = {
    origin: 'http://localhost:8080', // Thay đổi theo địa chỉ của client của bạn
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Authentication'],
};

// Sử dụng middleware CORS
app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/create-index', async (req, res) => {
    try {
      const response = await esClient.indices.create({
        index: 'products'
      });
      res.send(response);
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  app.post('/add-products', async (req, res) => {
    const products = [
        { "name": "Product 1", "description": "Description for Product 1", "price": 99.99 },
        { "name": "Product 2", "description": "Description for Product 2", "price": 149.99 },
        { "name": "Product 3", "description": "Description for Product 3", "price": 199.99 }
    ]

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).send({ message: 'No products provided.' });
    }

    const body = products.flatMap(product => [{ index: { _index: 'products' } }, product]);

    try {
        const response = await esClient.bulk({ refresh: true, body });
        res.send(response);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

app.get('/search', async (req, res) => {
    try {
        const { q } = req.query; // Nhận tham số tìm kiếm từ URL (vd: /search?q=Product)
        
        // Thực hiện tìm kiếm trong Elasticsearch
        const response = await esClient.search({
            index: 'products',
            body: {
                query: {
                    match: { name: q } // Tìm kiếm theo tên sản phẩm
                }
            }
        });
        
        // Lấy danh sách các sản phẩm từ response
        const products = response.hits.hits.map(hit => ({
            id: hit._id, // ID của sản phẩm
            ...hit._source // Thêm dữ liệu từ _source vào
        }));
        
        // Trả về mảng sản phẩm
        res.send(products);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

app.use('/api/admin', adminApiRouter);
app.use('/api/user', userApiRouter);

app.use('/admin/', adminWebRouter);
app.use('/', userWebRouter);

configViewEngine(app);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

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

app.use('/api/admin', adminApiRouter);
app.use('/api/user', userApiRouter);

app.use('/admin/', adminWebRouter);
app.use('/', userWebRouter);

configViewEngine(app);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Hàm lấy thông tin bài tập
const scrapeExercises = async (url) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        // Mảng chứa các bài tập
        const exercises = [];

        // Chọn các thẻ chứa thông tin bài tập
        $('.mbp_thumb_post').each((index, element) => {
            const title = $(element).find('.title').text().trim();
            const category = $(element).find('.badge-info').text().replace('Thể loại: ', '').trim();
            const difficulty = $(element).find('.badge-success').text().replace('Độ khó: ', '').trim();
            const description = $(element).find('.details .blog-page p').text().trim();
            const demo = $(element).find('.details.pt-0 .table-responsive').html();
            
            // Lưu thông tin bài tập vào mảng
            exercises.push({ title, category, difficulty, description, demo });
        });

        // Ghi dữ liệu vào tệp JSON
        const jsonFilePath = path.resolve(__dirname, 'seeds', 'exam.json');
        fs.writeFileSync(jsonFilePath, JSON.stringify(exercises, null, 2), 'utf-8');
        
        console.log(`Data written to ${jsonFilePath}`);
    } catch (error) {
        console.error(`Error fetching data: ${error.message}`);
    }
};

// Sử dụng hàm scrape
const url = 'https://zendvn.com/bai-tap-lap-trinh-chuyen-mang-thanh-chuoi-tang-dan-71'; // Thay đổi thành URL thực tế
scrapeExercises(url);

const urls = [
    
]

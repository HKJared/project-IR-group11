const puppeteer = require('puppeteer');

async function fetchQuoteDetails(url) {
    let browser;

    try {
        browser = await puppeteer.launch({ headless: true }); // Khởi động trình duyệt Puppeteer
        const page = await browser.newPage();

        // Thiết lập User-Agent để tránh bị chặn
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );

        await page.goto(url, { waitUntil: 'networkidle2' }); // Điều hướng đến trang
        await page.waitForSelector('.quoteDetailBody', { timeout: 5000 }); // Chờ phần tử xuất hiện

        // Lấy nội dung của trang
        const quoteDetails = await page.evaluate(() => {
            const contentElement = document.querySelector('.b-qt'); // Quote content
            const authorElement = document.querySelector('.bq_fq_a a'); // Quote author
            const topicsElements = document.querySelectorAll('.infoBoxV .bqQt.bq_s .bq_fl a'); // Quote topics

            const content = contentElement ? contentElement.innerText.trim() : '';
            const author = authorElement ? authorElement.innerText.trim() : '';
            const topics = Array.from(topicsElements).map((el) => el.innerText.trim());

            return { content, author, topics };
        });

        return quoteDetails;
    } catch (error) {
        console.error(`Lỗi khi thu thập dữ liệu từ URL: ${url}`, error);
        return null;
    } finally {
        if (browser) {
            await browser.close(); // Đóng trình duyệt
        }
    }
}

// Gọi hàm với URL cụ thể
(async () => {
    const url = 'https://www.brainyquote.com/quotes/charles_kingsley_382915'; // Thay đổi URL nếu cần
    const details = await fetchQuoteDetails(url);

    if (details) {
        console.log('Chi tiết trích dẫn:', details);
    } else {
        console.log('Không thể thu thập dữ liệu.');
    }
})();
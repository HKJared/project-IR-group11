const pool = require('../configs/connectDB'); // Đảm bảo bạn đã cấu hình pool kết nối DB

class ExamModel {
    
    // Tạo một item mới
    static async createExam(exam) {
        const queryString = `
            INSERT INTO exams(name, html_url, description) VALUES (?, ?, ?)
        `;

        try {
            const [result] = await pool.execute(queryString, [
                exam.name,
                exam.html_url,
                exam.description
            ]);
            return result.insertId;
        } catch (error) {
            console.error('Error executing createItem() query:', error);
            throw error;
        }
    }

    // Thêm nhiều exam
    static async createExams(exams) {
        const queryString = `
            INSERT INTO exams(name, html_url, description) VALUES (?, ?, ?)
        `;

        const insertIds = []; // Mảng lưu trữ các ID được chèn

        try {
            for (const exam of exams) {
                const [result] = await pool.execute(queryString, [
                    exam.name,
                    exam.html_url,
                    exam.description
                ]);
                insertIds.push(result.insertId); // Thêm ID vào mảng
            }
            return insertIds; // Trả về mảng ID
        } catch (error) {
            console.error('Error executing createExams() query:', error);
            throw error;
        }
    }
}

module.exports = ExamModel;

const fs = require('fs');
const path = require('path');

// Đường dẫn tới tệp JSON
const filePath = path.resolve(__dirname, 'data.json');

// Hàm để sắp xếp lại các trường trong mỗi phần tử của mảng
const reorderFields = (dataArray) => {
    return dataArray.map(item => {
        const { tendieu, noidung, ...rest } = item; // Tách tendieu và noidung
        return { tendieu, noidung, ...rest }; // Đưa tendieu và noidung lên đầu
    });
};

// Đọc tệp JSON, xử lý và ghi lại
const processJsonFile = async () => {
    try {
        // Đọc nội dung tệp JSON
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const dataArray = JSON.parse(fileContent);

        // Kiểm tra nếu nội dung là một mảng
        if (!Array.isArray(dataArray)) {
            throw new Error('Nội dung tệp JSON không phải là mảng.');
        }

        // Sắp xếp lại các trường
        const reorderedData = reorderFields(dataArray);

        // Ghi nội dung đã xử lý lại vào tệp JSON
        fs.writeFileSync(filePath, JSON.stringify(reorderedData, null, 4), 'utf-8');
        console.log('Tệp JSON đã được cập nhật thành công!');
    } catch (error) {
        console.error('Lỗi khi xử lý tệp JSON:', error.message);
    }
};

// Gọi hàm xử lý
processJsonFile();

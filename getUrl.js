// Import các module cần thiết
const fs = require('fs');

// Đọc dữ liệu từ file nhom_11.json
const filePath = './seeds/nhom_11.json';
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Lỗi khi đọc file:', err);
        return;
    }

    // Chuyển đổi dữ liệu JSON từ chuỗi sang mảng đối tượng
    let jsonArray;
    try {
        jsonArray = JSON.parse(data);
    } catch (parseErr) {
        console.error('Lỗi khi phân tích dữ liệu JSON:', parseErr);
        return;
    }

    // Giá trị link cần thêm
    const linkValue = "https://quantrimang.com/hoc/bai-tap-c-co-loi-giai-code-mau-143335";

    // Thêm thuộc tính link vào từng phần tử
    jsonArray.forEach(item => {
        item.link = linkValue;
    });

    // Ghi đè dữ liệu đã chỉnh sửa vào file nhom_11.json
    fs.writeFile(filePath, JSON.stringify(jsonArray, null, 4), 'utf8', writeErr => {
        if (writeErr) {
            console.error('Lỗi khi ghi file:', writeErr);
        } else {
            console.log('Dữ liệu đã được ghi thành công vào file nhom_11.json');
        }
    });
});

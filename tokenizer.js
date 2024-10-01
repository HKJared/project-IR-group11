const fs = require('fs');
const removeAccents = require('remove-accents');

// Hàm tokenizer đơn giản
function tokenize(text) {
    const tokens = [];
    const words = text.split(/\s+/); // Tách từ theo khoảng trắng
    for (let i = 0; i < words.length - 1; i++) {
        const shingle = `${words[i]} ${words[i + 1]}`;
        const startOffset = text.indexOf(words[i]);
        const endOffset = startOffset + shingle.length;

        tokens.push({
            token: removeAccents(shingle), // Loại bỏ dấu
            start_offset: startOffset,
            end_offset: endOffset,
            type: 'shingle',
            position: i
        });
    }
    return tokens;
}

// Đọc file JSON
fs.readFile('seeds/nhom11_data.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    const entries = JSON.parse(data);
    const allTokens = [];

    // Tạo token cho từng mục
    entries.forEach(entry => {
        const scientificTokens = tokenize(removeAccents(entry.scientific_name || ''));
        const vietnameseTokens = [];

        // Tạo token cho tên tiếng Việt
        (entry.vietnamese_name || []).forEach(name => {
            vietnameseTokens.push(...tokenize(removeAccents(name)));
        });

        const descriptionTokens = tokenize(removeAccents(entry.description || ''));

        // Kết hợp tất cả token lại
        allTokens.push(...scientificTokens, ...vietnameseTokens, ...descriptionTokens);
    });

    // Xuất kết quả ra file JSON
    const output = {
        tokens: allTokens
    };

    fs.writeFile('seeds/tokenizer_output.json', JSON.stringify(output, null, 4), err => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log("Tokenizer output has been saved to 'tokenizer_output.json'.");
    });
});

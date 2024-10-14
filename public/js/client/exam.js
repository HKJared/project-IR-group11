var editor;
$(document).ready(function() {
    editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        lineNumbers: true,
        mode: 'text/x-c++src', // Thay đổi mode cho C++
        theme: 'dracula', // Sử dụng theme Dracula
        autoCloseBrackets: true, // Tự động đóng ngoặc
        matchBrackets: true, // Khớp dấu ngoặc
        tabSize: 2, // Kích thước tab
        indentUnit: 2, // Đơn vị thụt lề
    });

    const savedTheme = localStorage.getItem('theme') || 'dark';

    editor.setOption("theme", savedTheme == 'dark' ? "dracula" : "default");
});

//  Set view
$(document).ready(async function() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const response = await getExamById(id);

    if (response && response.exam) {
        showExam(response.exam);
    }
})

// Xử lí sự kiện
$(document).ready(function() {
});

// Hàm xử lí giao diện
function showExam(exam) {
    console.log(exam);
    $('#title').html(exam.title);

    $('#description').html(exam.description);

    if (exam.code) {
        editor.setValue(exam.code); // Cập nhật nội dung của editor với code từ API
    }
}

// hàm gọi api
async function getExamById(id) {
    const token = localStorage.getItem('wiseoldAccessToken');

    try {
        const response = await fetch(`/api/user/exam?id=${ id }`, {
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
                'authentication': token
            }
        });

        const result = await response.json();

        if (!response.ok) {
            showNotification(result.message);
            throw new Error('Network response was not ok');
        }

        return result;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return null;
    } finally {

    }
}
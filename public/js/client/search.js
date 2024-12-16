var items_per_page = 10;
var keyword = '';
var page = 1;

// set view
$(document).ready(function() {
    const searchKey = getUrlParams();

    keyword = searchKey.keyword || '';
    page = searchKey.page || 1;

    $('#search_text').val(keyword);

    search();

});

// hàm xử lí sự kiện 
$(document).ready(function() {
    $(document).on('submit.subEvent', '#search_form', function(event) {
        event.preventDefault();

        keyword = $('#search_text').val().trim();

        page = 1;
        
        updateURL();

        search();
    });

    $(document).on('click.subEvent', '.pagination_item', function(event) {
        $('.pagination_item').removeClass('active');

        $(this).addClass('active');
        const pageNum = parseInt($(this).text(), 10);

        page = pageNum;

        updateURL()

        search();

        updateDisplayPagination($('.pagination_item').length, page);
    });
});

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);

    const keyword = params.get('keyword') || '';  // Lấy giá trị của 'keyword'
    const page = parseInt(params.get('page'), 10) || 1;  // Lấy giá trị của 'page', nếu không có thì mặc định là 1

    return { keyword, page };
}

// Hàm để loại bỏ dấu tiếng Việt
function removeDiacritics(str) {
    const diacriticsMap = {
        'a': 'áàảãạâấầẩẫậăắằẳẵặ',
        'e': 'éèẻẽẹêếềểễệ',
        'i': 'íìỉĩị',
        'o': 'óòỏõọôốồổỗộơớờởỡợ',
        'u': 'úùủũụưứừửữự',
        'y': 'ýỳỷỹỵ',
        'd': 'đ'
    };

    return Object.keys(diacriticsMap).reduce((acc, letter) => {
        const regex = new RegExp(`[${diacriticsMap[letter]}]`, 'g');
        return acc.replace(regex, letter);
    }, str);
}

// Hàm highlight từ khóa
function highlightKeyword(text, keyword) {
    if (!keyword) return text;

    // Chuyển đổi từ khóa thành chữ thường và bỏ dấu
    const normalizedKeywords = keyword.split(/\s+/).map(kw => removeDiacritics(kw.toLowerCase()));

    // Khởi tạo chuỗi kết quả
    let highlightedText = '';

    // Chia văn bản thành mảng các từ
    const words = text.split(/\s+/);

    // Duyệt qua từng từ
    for (const word of words) {
        const normalizedWord = removeDiacritics(word.toLowerCase());
        // Kiểm tra nếu từ đã normalize có trong mảng các từ khóa và
        // đảm bảo nó là một từ độc lập bằng cách kiểm tra toàn bộ từ
        if (normalizedKeywords.includes(normalizedWord)) {
            highlightedText += `<strong class="highlight-text">${word}</strong> `;
        } else {
            highlightedText += `${word} `;
        }
    }

    // Trả về chuỗi kết quả đã được xử lý
    return highlightedText.trim(); // Loại bỏ khoảng trắng thừa ở cuối
}

function showExams(exams) {
    console.log(exams);
    $('.search_response__container').empty();

    if (!exams.length) {
        return;
    }

    exams.forEach(exam => {
        const highlightedDescription = highlightKeyword(exam.description || exam.meaning || exam.lyrics || exam.Content || exam.noidung, keyword); // Chỉ highlight từ khóa trong mô tả

        let url = '';
        let spa_action = '';
        let blank = ''

        if (exam.link || exam.url || exam.Link) {
            url = exam.link || exam.url || exam.Link;
            blank = '_blank'
        } else {
            url = `/exam?title=${exam.title} &id=${exam.id}`;
            spa_action = 'spa-action';
        }

        $('.search_response__container').append(`
            <div class="exam_item col gap-8">
                <a href="${ url }" class="title ${ spa_action }" target="${ blank }">
                    <span>${exam.title || exam.tendieu || exam.scientific_name || exam.content || exam.song || exam.Title}</span> <!-- Tiêu đề không được highlight -->
                </a>
                <div class="index-name">
                    <span>${ exam.index_name }</span>
                </div>
                <div class="description">
                    <span>${highlightedDescription}</span> <!-- Chỉ mô tả được highlight -->
                </div>
            </div>
        `);
    });

    $('html, body').animate({ scrollTop: 0 }, 'slow');
}

function createPaginationContainer(total_page) {
    $('.pagination__actions').empty();
    
    for (let i = 1; i < total_page + 1; i++) {
        $('.pagination__actions').append(`<button id="page_${ i }" class="pagination_item center">${ i }</button>`);
    }

    $(`#page_${ page }`).addClass('active');

    updateDisplayPagination(total_page, page);
}

function updateDisplayPagination(total_page, current_page) {
    const $paginationItems = $('.pagination_item');

    $paginationItems.each(function () {
        const pageNum = parseInt($(this).text(), 10);

        let showButton = false;

        if (total_page <= 7) {
            showButton = true;
        } else {
            if (current_page >= 4 && current_page <= total_page - 3) {
                showButton = pageNum >= current_page - 3 && pageNum <= current_page + 3;
            } else if (current_page < 4) {
                showButton = pageNum <= 7;
            } else {
                showButton = pageNum > total_page - 7;
            }
        }

        $(this).toggle(showButton);
    });
}

function updateURL() {
    const url = new URL(window.location.href);

    // Xóa tham số `keyword` và `page` khỏi URL trước khi thêm chúng lại
    url.searchParams.delete('keyword');
    url.searchParams.delete('page');

    // Chỉ thêm keyword vào URL nếu keyword không phải là chuỗi rỗng
    if (keyword !== '') {
        url.searchParams.set('keyword', keyword);
    }

    // Chỉ thêm page vào URL nếu page khác 1
    if (page !== 1) {
        url.searchParams.set('page', page);
    }

    // Sử dụng pushState để thay đổi URL mà không tải lại trang
    history.pushState({}, '', url);
}


async function search() {
    const response = await getExams();
    
    showExams(response.exams);

    if (page == 1) {
        createPaginationContainer(response.total_page);
    } 
}

async function getExams() {
    try {
        // Lấy danh sách các `value` của các checkbox được checked
        const indexNames = Array.from(document.querySelectorAll('.index-name__container input[type="checkbox"]:checked'))
            .map(input => input.value);
        console.log(indexNames)
        // Tạo URL query với mảng index_names
        const queryParams = new URLSearchParams({
            items_per_page,
            keyword,
            page,
            index_names: JSON.stringify(indexNames) // Chuyển mảng thành chuỗi JSON
        });

        const response = await fetch(`/api/user/search?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
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
        return [];
    }
}
var items_per_page = 20;
var keyword = '';
var page = 1;


$(document).ready(function() {
    search();

    $(document).on('submit.subEvent', '#search_form', function(event) {
        event.preventDefault();

        keyword = $('#search_text').val().trim();

        page = 1;
        
        search();
    });

    $(document).on('click.subEvent', '.pagination_item', function(event) {
        $('.pagination_item').removeClass('active');

        $(this).addClass('active');
        const pageNum = parseInt($(this).text(), 10);

        page = pageNum;

        search();

        updateDisplayPagination($('.pagination_item').length, page)
    })
});

function showExams(exams) {
    $('.search_response__container').empty();

    if(!exams.length) {
        return
    }

    exams.forEach(exam => {
        $('.search_response__container').append(`
            <div class="exam_item col gap-8">
                <a href="${ exam.html_url }" class="title">
                    <span>${ exam.title }</span>
                </a>
                <div class="description">
                    <span>${ exam.description }</span>
                </div>
            </div>
        `);
    });

    $('html, body').animate({ scrollTop: 0 }, 'slow');
}

function createPaginationContainer(total_page) {
    $('.pagination__actions').empty();
    console.log($('.pagination__actions'))
    for (let i = 1; i < total_page + 1; i++) {
        $('.pagination__actions').append(`<button id="page_${ i }" class="pagination_item center">${ i }</button>`)
    }

    $(`#page_${ page }`).addClass('active');

    updateDisplayPagination(total_page, page);
}

function updateDisplayPagination(total_page, current_page) {
    // Tìm tất cả các nút phân trang hiện có
    const $paginationItems = $('.pagination_item');

    // Lặp qua từng nút và ẩn hoặc hiện chúng dựa trên current_page
    $paginationItems.each(function () {
        const pageNum = parseInt($(this).text(), 10);

        // Logic hiển thị tối đa 7 nút phân trang
        let showButton = false;

        // Nếu tổng số trang nhỏ hơn hoặc bằng 7, hiển thị tất cả
        if (total_page <= 7) {
            showButton = true;
        } else {
            // Nếu nút active ở giữa (>= 4 và <= total_page - 3)
            if (current_page >= 4 && current_page <= total_page - 3) {
                showButton = pageNum >= current_page - 3 && pageNum <= current_page + 3;
            } else if (current_page < 4) {
                // Nếu nút active gần đầu
                showButton = pageNum <= 7; // Hiển thị 7 nút đầu
            } else {
                // Nếu nút active gần cuối
                showButton = pageNum > total_page - 7; // Hiển thị 7 nút cuối
            }
        }

        // Ẩn hoặc hiện nút dựa vào showButton
        $(this).toggle(showButton);
    });
}



async function search() {
    const response = await getExams();
    
    showExams(response.exams);

    if (page == 1) {
        createPaginationContainer(response.total_page);
    } 
}

// hàm gọi api
async function getExams() {
    try {
        const response = await fetch(`/api/user/search?items_per_page=${ items_per_page }&keyword=${ keyword }&page=${ page }`, {
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
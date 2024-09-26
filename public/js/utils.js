$(document).ready(function() {
    $(document).on('input change', 'input, select', function(event) {
        event.stopPropagation();

        $(this).removeClass('warning-border');
    });

    $(document).on('input', '.price', function(event) {
        var inputValue = $(this).val();

        $(this).val(formatMoney(inputValue));
    });

    $(document).on('input', 'input[type="number"]', function() {
        let value = $(this).val();
        // Loại bỏ tất cả các ký tự không phải số
        $(this).val(value.replace(/[^0-9.]/g, ''));
    });

    $(document).on('click', '.kecho__select', function(event) {
        event.stopPropagation();
        
        if ($(this).hasClass('focus')) {
            $(this).removeClass('focus');
            $(this).find('.select-options__container').slideUp();
            return
        }

        $('.kecho__select').removeClass('focus');
        $(this).addClass('focus');

        $('.select-options__container').slideUp();
        
        $(this).find('.select-options__container').slideDown();
    });

    $(document).on('click', '.select-options__box span', function(event) {
        event.preventDefault();
        
        $(this).closest('ul').find('span').removeClass('selected');
        $(this).addClass('selected');

        const option_name = $(this).text();
        $(this).closest('.kecho__select').find('.select__text span').text(option_name);

        const option_val = $(this).data('val');
        $(this).closest('.kecho__select').attr('data-val', option_val);
    });

    $(document).on('click', '.to-top-btn', function(event) {
        event.stopPropagation();

        $('.main-body').animate({scrollTop: 0}, 500);
    });

    // Hàm xử lý khi nhấn nút prev
    $(document).on('click', '.prev-page', function () {
        if ($(this).hasClass('not-allowed')) return; // Không làm gì nếu nút bị disabled
        page--; // Giảm số trang
        search(); // Gọi hàm tìm kiếm với trang mới
        updatePaginationButtons(); // Cập nhật trạng thái nút
    });

    // Hàm xử lý khi nhấn nút next
    $(document).on('click', '.next-page', function () {
        if ($(this).hasClass('not-allowed')) return; // Không làm gì nếu nút bị disabled
        page++; // Tăng số trang
        search(); // Gọi hàm tìm kiếm với trang mới
        updatePaginationButtons(); // Cập nhật trạng thái nút
    });
});

function showNotification(message) {
    let notificationHTML = `
    <div id="notification" class="notification">
        <span id="notificationText">${message}</span>
    </div>
    `;

    $('body').append(notificationHTML);

    $('#notification').show();

    setTimeout(() => {
        setTimeout(() => {
            $('#notification').addClass('right-slide');
        }, 10);
    }, 10);
    setTimeout(() => {
        $('#notification').removeClass('right-slide'); 
        setTimeout(() => {
            $('#notification').hide();
            $('#notification').remove();
        }, 500);
    }, 3000); 
}

function showConfirm(message, confirmBtnText, warningMessage = '', callback) {
    let warningHTML = warningMessage ? `<span class="warning-message">${warningMessage}</span>` : '';

    let confirmContainerHTML = `
    <div class="confirm-container center">
        <div class="confirm">
            <div class="confirm-body col">
                <div class="confirm-content col gap-4">
                    <span>${message}</span>
                    ${warningHTML}
                </div>
                <div class="confirm-action row">
                    <button class="cancel-btn">Hủy bỏ</button>
                    <button class="confirm-btn">${confirmBtnText}</button>
                </div>
            </div>
        </div>
    </div>
    `;

    $('body').append(confirmContainerHTML);

    $('.confirm-container').css('display', 'flex');

    $('.confirm-btn').off('click').on('click', function() {
        $('.confirm-container').remove();
        if (callback) callback(true); // Người dùng nhấp vào Confirm
    });

    $('.cancel-btn').off('click').on('click', function() {
        $('.confirm-container').remove();
        if (callback) callback(false); // Người dùng nhấp vào Cancel
    });
}



function validatePhoneNumber(phoneNumber) {
    // Xóa tất cả khoảng trắng khỏi số điện thoại
    phoneNumber = phoneNumber.replace(/\s+/g, '');

    // Kiểm tra độ dài của số điện thoại (thường là 10 chữ số)
    if (phoneNumber.length !== 10) {
        return false;
    }

    // Đầu số hợp lệ ở Việt Nam
    const validPrefixes = [
        "032", "033", "034", "035", "036", "037", "038", "039", "086",  // Viettel
        "070", "079", "077", "076", "078", "089",                      // Mobifone
        "083", "084", "085", "081", "082", "088", "094",              // Vinaphone
        "056", "058", "092", "052",                                  // Vietnamobile
        "059", "099",                                               // Gmobile
        
    ];

    // Lấy 3 ký tự đầu của số điện thoại để kiểm tra
    const prefix = phoneNumber.substring(0, 3);

    // Kiểm tra xem đầu số có hợp lệ không
    if (!validPrefixes.includes(prefix)) {
        return false;
    }

    // Nếu qua được tất cả các kiểm tra, số điện thoại là hợp lệ
    return true;
}

function renderLoading() {
    let loadingHTML = `
    <div class="loading-container">
        <div class="loading-wrapper">
            <div class="loading set_1"></div>
            <div class="loading set_2"></div>
            <div class="loading set_3"></div>
            <div class="loading set_4"></div>
            <div class="loading set_5"></div>
        </div>
    </div>
    `;

    $('html > body').append(loadingHTML)
}

function renderSearchLoading() {
    let loadingHTML = `
    <div class="loading-container">
        <div class="loading-wrapper">
            <div class="search-loading-circle"></div>
            <div class="search-icon center">
                <i class="fa-solid fa-search"></i>
            </div>
        </div>
    </div>
    `;

    $('html > body').append(loadingHTML);
}

function removeLoading() {
    $('.loading-container').remove();
}

function formatMoney(input) {
    if (!input) {
        input = '';
    }

    var number = input.toString().replace(/\D/g, '');

    var formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formattedNumber;
}

function formatDiscountMoney(input = '0', discount = 0) {
    // Chuyển đổi giá trị đầu vào thành số
    let originalPrice = parseFloat(input);
    
    // Tính giá sau khi giảm giá
    let discountedPrice = originalPrice * (1 - discount / 100);
    
    // Làm tròn đến hàng trăm
    discountedPrice = Math.round(discountedPrice / 100) * 100;
    
    // Trả về giá trị đã được định dạng
    return formatMoney(discountedPrice);
}

function moneyToNumber (money) {
    if (!money) {
        return 0; // hoặc có thể trả về NaN hoặc một giá trị mặc định khác nếu bạn muốn
    }

    return money.toString().replace(/[,. ]/g, "")
}

function convertNumber(number) {
    if (number < 1000) {
        return number.toString();
    } else if (number >= 1000 && number < 1000000) {
        return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
}

// Hàm tính toán giá sau khi triết khấu và làm tròn đến hàng nghìn
function getDiscountPrice(price, discount) {
    if (discount > 0) {
        let discountPrice = price * (1 - discount / 100);
        return Math.round(discountPrice / 1000) * 1000; // Làm tròn đến nghìn
    }
    return price;
}

// hàm kiểm tra dữ liệu
function checkPrice(price) {
    price = parseInt(price.replace(/[,. ]/g, ""));

    if (price < 1000) {
        return false
    }
    return true
}

// Hàm kiểm tra và cập nhật trạng thái nút next/prev
function updatePaginationButtons() {
    const prevButton = $('.prev-page');
    const nextButton = $('.next-page');
    const currentPageSpan = $('.current-page'); // Thẻ span hiển thị số trang

    // Cập nhật số trang hiển thị
    currentPageSpan.text(page);

    // Nếu trang hiện tại là 1, disable nút prev
    if (page == 1) {
        prevButton.addClass('not-allowed');
    } else {
        prevButton.removeClass('not-allowed');
    }

    // Nếu trang hiện tại là trang cuối cùng, disable nút next
    if (page === total_pages) {
        nextButton.addClass('not-allowed');
    } else {
        nextButton.removeClass('not-allowed');
    }
}

function showStackedNotification(message, id) {
    // Kiểm tra nếu container chưa tồn tại thì thêm vào body
    if ($('.notification-container').length === 0) {
        $('body').append('<div class="notification-container"></div>');
    }

    // Kiểm tra xem thông báo với id đã tồn tại chưa
    let $notification = $(`#${id}`);

    if ($notification.length == 0) {
        // Tạo thông báo mới
        let notificationHTML = `
        <div id="${id}" class="notification-item">
            <span class="notification-text">${message}</span>
            <button class="close-btn center"><i class="fa-solid fa-xmark"></i></button>
        </div>
        `;

        // Thêm thông báo vào container
        $('.notification-container').append(notificationHTML);

        // Lấy phần tử thông báo vừa thêm
        $notification = $(`#${id}`);

        // Hiệu ứng xuất hiện
        $notification.show().addClass('right-slide');

        // Xử lý khi click vào nút close
        $notification.find('.close-btn').click(function() {
            $notification.removeClass('right-slide');
            $notification.css('opacity', 0); // Giảm độ mờ về 0
            setTimeout(() => {
                $notification.remove(); // Xóa thông báo khỏi DOM sau khi hoàn tất hiệu ứng
            }, 500); // Thời gian khớp với thời gian hiệu ứng giảm độ mờ
        });

        // Tự động xóa thông báo sau 10 giây
        setTimeout(() => {
            if ($notification.length) {
                $notification.removeClass('right-slide');
                $notification.css('opacity', 0); // Giảm độ mờ về 0
                setTimeout(() => {
                    $notification.remove(); // Xóa thông báo khỏi DOM sau khi hoàn tất hiệu ứng
                }, 500); // Thời gian khớp với thời gian hiệu ứng giảm độ mờ
            }
        }, 10000); // 10 giây
    } else {
        // Nếu thông báo đã tồn tại, thêm lớp zoom-scale để thực hiện hiệu ứng co lại
        $notification.addClass('zoom-scale');
        
        // Xóa lớp zoom-scale sau khi hiệu ứng hoàn tất
        setTimeout(() => {
            $notification.removeClass('zoom-scale');
        }, 1000); // Thời gian khớp với thời gian của hiệu ứng co lại
    }
}
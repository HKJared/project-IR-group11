//  Set view
$(document).ready(function() {
    const currentTheme = localStorage.getItem('theme') || 'dark';

    $('body').addClass(currentTheme == 'dark' ? 'darkmode' : '');
    $('.logo img').attr('src', currentTheme == 'dark' ? '/images/logo.png' : '/images/logo-light.png');
    $('#toggle-theme .btn__icon').addClass(currentTheme == 'dark' ? 'fa-moon' : 'fa-sun');

    // Đặt theme ban đầu khi tải trang
    $('html').attr('data-theme', currentTheme);
})

// Xử lí sự kiện
$(document).ready(function() {
    // Lắng nghe sự kiện click để chuyển đổi theme
    $('#toggle-theme').on('click', function() {
        let theme = $('html').attr('data-theme');
        const $icon = $(this).find('.btn__icon');

        $icon.addClass('animated');

        if (theme === 'light') {
            $('html').attr('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            $('body').addClass('darkmode');
            $('.logo img').attr('src', '/images/logo.png');
            $icon.removeClass('fa-sun').addClass('fa-moon');
        } else {
            $('html').attr('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            $('body').removeClass('darkmode');
            $('.logo img').attr('src', '/images/logo-light.png');
            $icon.removeClass('fa-moon').addClass('fa-sun');
        }

        setTimeout(() => {
            $icon.removeClass('animated');
        }, 500)
    });

    // Lắng nghe sự kiện tìm kiếm
    $('#search_form').submit(function(event) {
        event.preventDefault();

        if ($('.search_response__container').length) {
            return
        }

        keyword = $('#search_text').val().trim();
        window.location.href = `/search?keyword=${ keyword }`
    });
});

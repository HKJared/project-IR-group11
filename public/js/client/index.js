$(document).ready(async function() {
    if (localStorage.getItem('userAccessToken')) {
        refreshToken();

        setInterval(function() {
            refreshToken();
        }, 840000);

        const response = await getUserInfo();

        if (response.user) {
            user = response.user;
            $(document).trigger('userUpdated', [user]);
            setUserInfo(user);
        }
    }

    const { index_names } = await getIndexNames();
    createListIndex(index_names);

    // Lấy element từ server khi vừa load lại trang
    const currentHref = window.location.href;
    updateViewBasedOnPath(currentHref);

    // Lấy element mới từ thẻ a.spa-action vừa được click
    $(document).on('click', '.spa-action', function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const href = $(this).attr('href');
        // Kết hợp base URL hiện tại với href mới để tạo URL đầy đủ
        const fullUrl = new URL(href, window.location.origin + window.location.pathname);
        
        updateViewBasedOnPath(fullUrl.toString());
    });

    // Xử lý sự kiện cuộn cho .nav-item
    $(document).on('click', '.nav-item', function(event) {
        event.preventDefault();

        const hash = $(this).attr('href');
        scrollToElementInMainBody(hash);

        // Cập nhật active class cho nav-item
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
    });

    // Xử lý sự kiện popstate khi người dùng nhấn quay lại hoặc tiến tới
    $(window).on('popstate', function() {
        getElementByHref(window.location.pathname);
    });
});

function createListIndex(index_names) {
    let listIndexHTML = '';
    for (let i = 0; i < index_names.length; i++) {
        listIndexHTML += `
            <input type="checkbox" name="" id="index_${ i }" value="${ index_names[i] }">
            <label for="index_${ i }">${ index_names[i] }</label>
        `
    }

    $('body').append(`
        <div class="index-name__container">
            ${ listIndexHTML }
        </div>
    `);
}

// Hàm xử lý giao diện
function updateViewBasedOnPath(href) {
    // Tạo URL từ href và bảo toàn tất cả các phần của URL
    const newUrl = new URL(href, window.location.origin);
    
    // Cập nhật thanh địa chỉ mà không tải lại trang
    window.history.pushState({}, '', newUrl.toString());

    // Gọi hàm xử lý giao diện với URL đầy đủ (bao gồm pathname, search, hash)
    if (newUrl.pathname == '/' || newUrl.pathname == '') {
        getElementByHref('/search')
    } else {
        getElementByHref(newUrl.pathname + newUrl.search + newUrl.hash);
    }
}

// Hàm cuộn đến phần tử trong .main-body với khoảng cách cách 60px từ trên cùng
function scrollToElementInMainBody(hash) {
    const targetElement = $(hash);
    if (targetElement.length) {
        const mainBody = $('.main-body');
        const offsetTop = targetElement.offset().top - mainBody.offset().top - 60;
        mainBody.animate({ scrollTop: mainBody.scrollTop() + offsetTop }, 500);
    }
}

// hàm cập nhật người dùng (đã đăng nhập/ chưa đăng nhập)
function setUserInfo(user) {
    if (!user) {
        return
    }

    $('.avatar img').attr('src', user.avatar_url || '/images/user.png');
    $('.username span').html(user.username);
    $('.username').append(`
        <div class="tooltip__container">
            <div class="tooltip__box">
                <div class="tooltip__triangle"></div>
                <div class="tooltip__content col">
                    <a href="/user/account" class="tooltip-item spa-action center">Tài Khoản Của Tôi</a>
                    <a href="/user/orders" class="tooltip-item spa-action center">Đơn Hàng</a>
                    <button class="tooltip-item spa-action logout-btn">Đăng Xuất</button>
                </div>
            </div>
        </div>
    `);
    $('body').addClass('logged-in');
}

// hàm gọi api
function logout() {
    const token = localStorage.getItem('userRefreshToken');
    renderLoading();
    fetch('/api/logout', {
        method: 'POST',
        headers: {
            "authentication": token,
            "Content-Type": "application/json" 
        }
    })
    .then(response => {
        return response.json().then(result => {
            if (!response.ok) {
                removeLoading();
                localStorage.removeItem('userAccessToken');
                localStorage.removeItem('userRefreshToken');
                window.location.href = '/store/'
                throw new Error('Network response was not ok');
            }
            return result;
        });
    })
    .then(result => {
        removeLoading();
        localStorage.removeItem('userAccessToken');
        localStorage.removeItem('userRefreshToken');
        window.location.href = '/login'
    })
    .catch(error => {
        removeLoading();
        console.error('There was a problem with the fetch operation:', error);
    });
}

function refreshToken() {
    const token = localStorage.getItem('userRefreshToken');
    fetch('/api/user-refresh-token', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authentication": token
        }
    })
    .then(response => {
        return response.json().then(result => {
            if (!response.ok) {
                localStorage.removeItem('userAccessToken');
                localStorage.removeItem('userRefreshToken');
                showNotification('Phiên đang nhập đã hết hạn, vui lòng đăng nhập lại.');
                setTimeout(function() {
                    window.location.href = '/'
                }, 2000)
                throw new Error('Network response was not ok');
            }
            return result;
        });
    })
    .then(result => {
        localStorage.setItem('userAccessToken', result.access_token);
    })
    .catch(error => {
        removeLoading();
        console.error('There was a problem with the fetch operation:', error);
    });
}

function getElementByHref(href) {
    if (href == '/' || href == '') {
        href = '/search';
    }
    
    fetch(`/api/user/element${href}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
        $(document).off('.kechoEvent');
        $('.main-body').html(html);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

async function getUserInfo() {
    const token = localStorage.getItem('userRefreshToken');
    if (!token) {
        return null
    }

    try {
        const response = await fetch(`/api/user`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authentication": token
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

async function getIndexNames() {
    try {
        const response = await fetch(`/api/user/index-names`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
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
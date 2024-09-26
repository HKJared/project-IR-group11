var items_per_page = 10;
var keyword = '';
var page = 1;


$(document).ready(function() {
    search();

    $(document).on('submit.subEvent', '#search_form', function(event) {
        event.preventDefault();

        keyword = $('#search_text').val().trim();

        page = 1
        
        search();
    });
});

function showExams(exams) {
    
}

async function search() {
    const exams = await getExams();
    
    showExams(exams)
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
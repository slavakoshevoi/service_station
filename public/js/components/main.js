$(document).ready(function () {

    var element = document.getElementById(window.location.pathname);
    if (element !== null) {
        element.classList.add("active");
    }

    $('.modal-window-link').on('click', function () {
        if (document.body.offsetHeight > window.innerHeight) {
            $('.white_block').outerWidth(+window.innerWidth - 17);
        }
    });

    $('.hide_alert').on('click', function () {
        $('.alert').slideUp();
    });

    setTimeout(function () {
        $('.hide_alert').trigger('click');
    }, TIME_FOR_FLASH);

    $('.dtable').DataTable();

    $('.datetimepickerN').datetimepicker(
        {
            locale: "ru",
            format: "YYYY.MM.DD HH:mm:ss"
        }
    );

});

const TIME_FOR_FLASH = 7500;
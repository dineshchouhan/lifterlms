var $ = jQuery;
$(document).ready(function () {

    $('.got_voucher').click(function (e) {
        e.preventDefault();

        $('.voucher-expand').slideToggle();
    });
});
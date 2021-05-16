/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-02-24
 * Time: 12:36 AM
 */

$(document).ready(function()
{
    let settings = yasbil_get_settings();

    $('input[name=wp_url]').val(settings.URL);
    $('input[name=wp_user]').val(settings.USER);
    $('input[name=wp_app_pass]').val(settings.PASS);

    // remove trailing spaces and slashes from WP-url
    $('input[name=wp_url]').on('change paste keyup', function() {
        $(this).val($(this).val().trim().replace(/\/+$/g, ''));
    });

    // remove trailing spaces from WP-user
    $('input[name=wp_user]').on('change paste keyup', function() {
        $(this).val($(this).val().trim());
    });

    // remove trailing spaces from WP-wp_app_pass
    $('input[name=wp_app_pass]').on('change paste keyup', function() {
        $(this).val($(this).val().trim());
    });


    $('form#settingsForm').submit(function(e)
    {
        e.preventDefault();

        const elFormContainer = $('div.settings-form-container');
        const elAlert = $('div#settingsSaveMsg');
        const elSubmitBtn = $('button#saveSettings');

        elSubmitBtn.hide();
        elFormContainer.css({opacity: 0.2});
        elSubmitBtn.prop("disabled",true);
        elAlert
            .html('Checking...')
            .addClass('alert-warning')
            .removeClass('alert-success')
            .removeClass('alert-danger');

        let alert_class = 'alert-success';
        let msg = '';

        yasbil_save_settings(
            $('input[name=wp_url]').val().trim().replace(/\/+$/g, ''),
            $('input[name=wp_user]').val().trim(),
            $('input[name=wp_app_pass]').val().trim()
        );


        yasbil_verify_settings().then(check_result =>
        {
            if(!check_result.ok)
            {
                alert_class = 'alert-danger';
                msg = 'Unable to login to server using entered settings. ' +
                    'Here is the error message: <br/>' +
                    `<b>${check_result.msg}</b>`;
            }
            else
            {
                alert_class = 'alert-success';
                msg = 'Remote connection successful. Settings saved.'
            }

            elFormContainer.css({opacity: 1});
            elSubmitBtn.prop("disabled",false);
            elAlert
                .html(msg)
                .removeClass('alert-warning')
                .addClass(alert_class);
            elSubmitBtn.show();
        }); // -- verify settings then end() ---



    }); // ------ form submit end ---

}); // -- document.ready end ---
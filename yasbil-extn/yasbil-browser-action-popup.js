/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-01-12
 * Time: 07:10 PM CDT
 */


//-------------------- Establish Connection with BG Script -----------------
// cs = content script
// bg = background script
let portToBG = browser.runtime.connect({name:"port-ba-popup-to-bg"});

$(document).ready(function()
{
    refreshPopupElements();

    const yasbil_settings = yasbil_get_settings();
    const yasbil_wp_link = yasbil_settings.URL + '/wp-admin/admin.php?page=yasbil_wp';

    $('a#yasbil_wpl_url').attr("href", yasbil_wp_link);

    $('#logToggle').change(function() //yasbil toggle change label
    {
        // double-checking: no active sync job
        if(get_sync_status() === "OFF")
        {
            if(this.checked) // logging session start (not syncing)
            {
                portToBG.postMessage({yasbil_msg: "LOG_START"});

                // log btn: on
                // log btn: show
                // sync control: hide
                // sync progress: hide

                setLogON();
                $('div#log_controls').show();
                $('div#sync_controls').hide();
                $('div#sync_progress').hide();
            }
            else // logging session end
            {
                portToBG.postMessage({yasbil_msg: "LOG_END"});

                // log btn: off
                // log btn: show
                // sync control: show
                // sync progress: hide

                setLogOFF();
                $('div#log_controls').show();
                if(get_sync_rows_tot() > 0)
                    $('div#sync_controls').show();
                else
                    $('div#sync_controls').hide();
                $('div#sync_progress').hide();
            }
        }
    });

    // -------- do sync job ----------
    $('button#do_sync').click(function ()
    {
        // double-checking: no active logging session
        if(get_session_guid() === "0")
        {
            portToBG.postMessage({yasbil_msg: "DO_SYNC"});
            setLogOFF();
            $('div#log_controls').hide();
            $('div#sync_controls').hide();
            refreshSyncProgress();
            $('div#sync_progress').show();
        }
    });

    // refresh popup elements every 1 second
    setInterval(refreshPopupElements, 1000); //1 sec in ms
});


// ---------------------- setLogON ----------------------
function setLogON(set_prop = true)
{
    $('#logToggleLabel').html('Logging <span class="fs-5 badge bg-primary">ON</span>');
    $('#logToggle').prop( "checked", true );
    //if(set_prop) // so that we can reuse this function in change handlers (where prop is already set)
        // $('#logToggle').prop( "checked", true );
}


// ---------------------- setLogOFF ----------------------
function setLogOFF(set_prop = true)
{
    $('#logToggleLabel').html('Logging <span class="fs-5 badge bg-light text-dark">OFF</span>');
    $('#logToggle').prop( "checked", false );
    // if(set_prop) // so that we can reuse this function in change handlers (where prop is already set)
    //     $('#logToggle').prop( "checked", false );
}

// ---------------------- refreshSyncProgress ----------------------
function refreshSyncProgress()
{
    const sync_result = get_sync_result();

    let elAlert = $('div#sync_progress');
    let elProgBar = $('div#sync_progressbar');

    switch (sync_result) {
        case 'PROGRESS':
            elAlert.removeClass().addClass('alert alert-primary');
            elProgBar.show();
            break;

        case 'SUCCESS':
            elAlert.removeClass().addClass('alert alert-success');
            elProgBar.hide();
            break;

        case 'ERROR':
            elAlert.removeClass().addClass('alert alert-danger');
            elProgBar.hide();
            break;

        case 'INIT': // initial / default condition (for better UX)
            elAlert.removeClass().addClass('alert alert-primary');
            elProgBar.hide();
            break;
    }
}


// ---------------------- refreshPopupElements ----------------------
// refreshes various elements of popup
// called every one second
function refreshPopupElements()
{
    $('#sync_data_msg').html(get_sync_data_msg());
    $('p#sync_progress_msg').html(get_sync_progress_msg());

    const is_logging = (get_session_guid() !== "0") ;
    const is_syncing = (get_sync_status() === "ON");

    // sync data: always show

    if(!is_logging && !is_syncing) //not logging, not syncing
    {
        // log btn: off
        // log btn: show
        // sync control: show if available sync data
        // sync progress: hide

        setLogOFF();
        $('div#log_controls').show();
        if(get_sync_rows_tot() > 0)
            $('div#sync_controls').show();
        else
            $('div#sync_controls').hide();
        $('div#sync_progress').hide();
    }
    else if(is_logging && !is_syncing) // logging; NOT syncing
    {
        // log btn: on
        // log btn: show
        // sync control: hide
        // sync progress: hide

        setLogON();
        $('div#log_controls').show();
        $('div#sync_controls').hide();
        $('div#sync_progress').hide();
    }
    else if(!is_logging && is_syncing) // syncing; NOT logging
    {
        // log btn: off
        // log btn: hide
        // sync control: hide
        // sync progress: refresh
        // sync progress: show

        setLogOFF();
        $('div#log_controls').hide();
        $('div#sync_controls').hide();
        refreshSyncProgress();
        $('div#sync_progress').show();
    }

    // 4th situation logging and syncing NOT allowed
}



/*************
 // ---------------------- showSyncControls ----------------------
 function showSyncControls() {
    $('div#sync_controls').show();
    $('button#do_sync').prop('disabled', false);
}


 // ---------------------- hideSyncControls ----------------------
 function hideSyncControls(){
    $('div#sync_controls').hide();
    $('button#do_sync').prop('disabled', true);
}


 // ---------------------- setSyncON ----------------------
 function setSyncON()  {
    $('div#log_controls').hide(); // hide log controls
    hideSyncControls(); // hide sync controls
    $('div#sync_progress').show(); // show sync progress
}


 // ---------------------- setSyncOFF ----------------------
 function setSyncOFF() {
    $('div#log_controls').show(); // show log controls
    showSyncControls(); // show sync controls
    $('div#sync_progress').hide(); // hide sync progress
}
 *************/


/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-03
 * Time: 10:23 AM CDT
 */

// import * as db from './yasbil_00_db.js';


$(document).ready(async function()
{
    const remote_resp = await get_remote_data_viz()

    if(!remote_resp.ok)
    {
        $('#ajax_error .alert-danger').html(remote_resp.msg);
        $('#ajax_success').hide();
        $('#ajax_error').show();
        return;
    }

    const remote_data = remote_resp.resp_body_json;


     // -------------------- overall browsing activity heatmap -----------

    //$('#remote_data_disp').text(JSON.stringify(remote_data, null, 4));

    //console.log(remote_data);
    //console.log(remote_data.sql);

    let browse_heatmap = new CalHeatMap();

    browse_heatmap.init({
        itemSelector: document.querySelector('#browse_heatmap'),
        domain: "month",
        subDomain: "x_day",
        range: 3,
        domainGutter: 20,
        data: remote_data['browse_heatmap_data'],
        previousSelector: "#browse_heatmap_prev",
        nextSelector: "#browse_heatmap_next",
        cellSize: 30,
        tooltip: true,
        itemName: "minute",
        subDomainTextFormat: "%d",
        domainLabelFormat: "%B %Y",
        highlight: "now",


        // Date() takes in milliseconds, while
        // CalHeatMap() data takes in seconds
        start: new Date(remote_data['browse_heatmap_st'] * 1000),
        minDate: new Date(remote_data['browse_heatmap_end'] * 1000),
        maxDate: new Date(remote_data['browse_heatmap_end'] * 1000),
    });


    // ------------ pagevisits datatable -----------------
    //console.log(remote_data['pv_data']);

    $('#yasbil_session_pagevisits').dataTable({
        data: remote_data['pv_data'],
        pageLength: 25, autoWidth: false,
        //searchBuilder: true,
        searchBuilder: false,
        searchPanes: {cascadePanes: true, viewTotal: true},
        language: {searchPanes: {countFiltered: '{shown} / {total}'}},
        dom: 'Plfritip',
        //dom: 'QPlfritBip',
        //buttons: ['copy', 'csv', 'excel'], //'pdf', 'print'],
        columnDefs: [
            {targets: [4], searchPanes: {header: 'Transition'},},
            //{targets: [0], searchPanes: {show: false},}
        ],
        order: [[0, 'desc'], [1, 'desc']],
    });
}); // -- document.ready end ---


// - get pre-processed viz data
async function get_remote_data_viz()
{

    const res_remote_data = {
        ok: true,
        // resp_body_json: null, // needed?
        msg:''
    };

    ajaxLoader('show');
    //await sleep(2000);

    try
    {
        // --------- STEP 1: setting up GET request ---------
        const settings = yasbil_get_settings();
        const basic_auth = btoa(settings.USER + ':' + settings.PASS);

        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Basic " + basic_auth);
        myHeaders.append("Content-Type", "application/json");

        const req_options = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        const req_url = settings.URL + API_NAMESPACE + REMOTE_DATA_VIZ_ENDPOINT;


        // --------- STEP 2: making request and parsing response ---------

        // fetch() requires TWO promise resolutions:
        // 1. fetch() makes a network request to the url and returns a promise.
        //    The promise resolves with a response object when the remote server
        //    responds with headers, but BEFORE the full response is downloaded.
        // 2. To read the full response, we should call the method response.text():
        //    it returns a promise that resolves when the full text is downloaded
        //    from the remote server, with that text as a result.

        const response = await fetch(req_url, req_options);
        const json_resp = await response.json(); //checkJSON(txt_resp);

        //const txt_resp = await response.text();

        if(!response.ok)
            throw new Error(
                `<b>${response.status}: ${response.statusText}.</b>
                Failed to get remote viz data.
                <br/>
                <br/>
                URL:<br/> ${response.url}
                <br/>
                <br/>
                Response: <br/>
                <samp>${json_resp}</samp>
                `
            );


        if(!json_resp)
            throw new Error(`Invalid JSON returned: ${txt_resp}`);

        res_remote_data.resp_body_json = json_resp;

    }
    catch (err)
    {
        res_remote_data.ok = false;
        res_remote_data.msg = err.toString();

        console.error(`------------- Error get_remote_data_viz() -------------`);
        console.error(err);
        console.error(err.stack);
    }

    ajaxLoader('hide');

    return res_remote_data;
}


function ajaxLoader(_disp)
{
    if(_disp === 'show')
    {
        $('main').css("filter", "blur(10px)");
        $('#ajaxLoader').show();
    }
    else if(_disp === 'hide')
    {
        $('main').css("filter", "blur(0px)");
        $('#ajaxLoader').hide();
    }
}
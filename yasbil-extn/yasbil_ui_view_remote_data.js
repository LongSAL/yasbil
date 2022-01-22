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

    /*const browse_heatmap_data = {
        1623619332.001: 1.1102,
        1623619548.001: 4.2072,
        1623620465.001: 7.4417,
        1623969224.001: 295.6825,
        1623983026.001: 143.1997,
        1623989800.001: 61.5686,
        1627333723.001: 0.4293,
        1627333850.001: 11.1435,
        1627334008.001: 7.3654,
        1627334945.001: 12.1819,

    };*/

    $('#remote_data_disp').text(JSON.stringify(remote_data, null, 4));

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

        /*onClick: function(date, nb) {
            $("#onClick-placeholder").html("You just clicked <br/>on <b>" +
                date + "</b> <br/>with <b>" +
                (nb === null ? "unknown" : nb) + "</b> items"
            );
        },*/


        // Date() takes in milliseconds, while
        // CalHeatMap() data takes in seconds
        start: new Date(remote_data['browse_heatmap_st'] * 1000),
        minDate: new Date(remote_data['browse_heatmap_end'] * 1000),
        maxDate: new Date(remote_data['browse_heatmap_end'] * 1000),

    });


    //await few seconds to load in-memory string cache
    // await sleep(1000);

}); // -- document.ready end ---



async function get_remote_data_viz()
{
    /**
     - get pre-processed viz data

     -------------------------
       Response JSON Format:
     -------------------------
     {
        browse_heatmap_data: [
            1623619332.001: 1.1102,
            1623619548.001: 4.2072,
        ],
     }
     */

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
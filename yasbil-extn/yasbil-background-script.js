/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-01-25
 * Time: 10:13 AM CDT
 */


/***************
 * 1. log session details
 * 1.1 session start and end times
 * 2. log tab details
 * 2.1 tab IDs
 * 3. log page visits
 * 4. log interactions within pages
 *
 *
 */


// initial state of browser extension: false
console.log('Initializing YASBIL extn');
set_session_id("0");
set_sync_status("OFF");


//------------ constants -------------
const API_NAMESPACE = '/wp-json/yasbil/v1';

const TABLES_TO_SYNC = [{
    name: 'yasbil_sessions',
    pk: 'session_guid',
    api_endpoint: '/sync_sessions',
    nice_name: 'Sessions data'
}, {
    name: 'yasbil_session_pagevisits',
    pk: 'pv_guid',
    api_endpoint: '/sync_pagevisits',
    nice_name: 'Webpage Visits data'
},
];



//-------------------- Establish Connection with Database -----------------
let db = new Dexie("yasbil_db");

db.version(1).stores({
    yasbil_sessions: 'session_guid,sync_ts',
    yasbil_session_pagevisits: 'pv_guid,session_guid,title_upd,sync_ts',
    //yasbil_session_framevisits: 'fv_guid',
});

db.open().then(async function (db) {
    await update_sync_data_msg();
    console.log('Database opened successfully');
}).catch (function (err) {
    console.log('DB Open Error occurred');
    console.log(err);
});


// db.open() needed?
// By default, db.open() will be called automatically
// on first query to the db.





//-------------------- Start (YASBIL) Logging Session -----------------
async function db_log_start()
{
    const session_guid = uuidv4();

    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/PlatformInfo
    // os: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/PlatformOs
    const platform_info = await browser.runtime.getPlatformInfo();

    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getBrowserInfo
    // TODO: get for other browsers?
    const browser_info = await browser.runtime.getBrowserInfo();

    const data_row = {
        session_guid: session_guid,

        platform_os: platform_info.os,
        platform_arch: platform_info.arch,
        platform_nacl_arch: platform_info.nacl_arch, //native client architecture

        // only in FF? (as per compatibility data)
        browser_name: browser_info.name,
        browser_vendor: browser_info.vendor,
        browser_version: browser_info.version,
        browser_build_id: browser_info.buildID,

        session_tz_str: Intl.DateTimeFormat().resolvedOptions().timeZone,
        session_tz_offset: new Date().getTimezoneOffset()*-1,
        session_start_ts: new Date().getTime(), //TODO: check time from internet time server?
        session_end_ts: 0,
        sync_ts: 0,
    };

    db.yasbil_sessions.add(data_row).then(async function ()
    {
        set_session_id(session_guid);

        await update_sync_data_msg();

        //***** add listeneres --> start logging ********
        // 1. log "normal" page visits
        browser.webNavigation.onCompleted.addListener(listener_webNav_onCompleted);
        // 2. log tab switches
        browser.tabs.onActivated.addListener(listener_tabs_onActivated);

        //3. TODO: log YouTube like page visitss
        browser.webNavigation.onHistoryStateUpdated.addListener(listener_webNav_onHistUpd);

        // change icon to logging-on icon
        browser.browserAction.setIcon({
            path : "icon/yasbil-icon-logging.png"
        });

        browser.browserAction.setTitle({
            title : "YASBIL is ON"
        });

        console.log('Session Start Insert Success: Woot! Did it');

    }).catch(function(error)
    {
        console.log("Session Start Insert Error: " + error);
    });
}





//-------------------- End (YASBIL) Logging Session -----------------
async function db_log_end()
{
    //first: remove listeners --> stop logging
    browser.webNavigation.onCompleted.removeListener(listener_webNav_onCompleted);
    browser.tabs.onActivated.removeListener(listener_tabs_onActivated);
    browser.webNavigation.onHistoryStateUpdated.removeListener(listener_webNav_onHistUpd);

    // start the database update
    let session_guid = get_session_id();

    if(session_guid && session_guid.length > 1)
    {
        //TODO: check time from internet time server;
        await db.yasbil_sessions.update(
            session_guid, {session_end_ts: new Date().getTime()}
        ).catch(function(error)
        {
            console.log("Session End DB Error: " + error);
        });

        // todo: do housekeeping
        //   1. if there's no pagevisits or interactions,
        //      delete this session?
        //   2. delete if session is less than threshold?(e.g. 30 s?)


        // Success - the data is updated!
        set_session_id("0");

        await update_sync_data_msg();

        browser.browserAction.setIcon({
            path : "icon/yasbil-icon-normal.png"
        });

        browser.browserAction.setTitle({
            title : "YASBIL is off"
        });

        console.log('Session End Success: Woot! Did it');

    }
    else {
        console.log('Session End Error: Invalid session ID', session_guid);
    }

}





//-------------------- log pagevisits method #1 -----------------
// Fired when a document, including the resources it refers to, is completely loaded
// and initialized. This is equivalent to the DOM 'load' event.
// event details: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onCompleted
// tab details: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
// history visittem: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history/VisitItem
async function listener_webNav_onCompleted(details)
{
    // console.log('webNavigation.onCompleted');

    if(details.frameId === 0)
    {
        await db_log_pagevisits(
            details.tabId,
            details.timeStamp,
            'webNavigation.onCompleted'
        );
    }
    else
    {
        // TODO: about iframes
        //  - should we log iframes?
        //  - if yes, how many much / other criteria? w3schools loads 50+ subframes
        //  - check url for about:blank?
    }
}



//-------------------- log tab switch (user re-visits pre opened tab) -----------------
// Fires when the active tab in a window changes. Note that the tab's
// URL may not be set at the time this event fired, but you can listen
// to tabs.onUpdated events to be notified when a URL is set.
// event details: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onActivated
async function listener_tabs_onActivated(details)
{
    // console.log('tabs.onActivated');

    await db_log_pagevisits(
        details.tabId,
        new Date().getTime(), //current timestamp
        'tabs.onActivated',
        true
    );
}




//-------------------- log YouTube like webpage visits? -----------------
// event docs: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onHistoryStateUpdated
async function listener_webNav_onHistUpd(details)
{
    // console.log('webNavigation.onHistoryStateUpdated');

    // note:
    // onHistoryStateUpdated is often fired twice by Google SERPs
    // it is fired once by YouTube
    // it is not fired by many webpages

    await db_log_pagevisits(
        details.tabId,
        details.timeStamp,
        'webNavigation.onHistoryStateUpdated',
    );
}






// --- single helper function to log pagevisits --------
// takes tabId, timestamp of visit, event-name that triggered this,
// and optionally, if tab-switch
async function db_log_pagevisits(tabId, ts, e_name, is_tab_switch=false)
{
    // TODO: get CURRENT tab info from where extension is switched on

    const tabInfo = await browser.tabs.get(tabId);

    const url = new URL(tabInfo.url);

    // do no track certain blocked domains (e.g. gmail, about:, etc)
    if(!is_tracking_allowed(url))
        return;

    //identify popular search engines and get search query from URL
    const se_info = get_search_engine_info(url);

    //get transition-type and visit time from history
    let transition_typ = '';
    let hist_visit_time = -1;
    let hist_visit_count = -1;
    const arr_hist = await browser.history.getVisits({url: tabInfo.url});

    if(arr_hist.length > 0)
    {
        const last_visit = arr_hist[0]; //array is sorted in rev chronological order
        transition_typ = last_visit.transition;
        hist_visit_time = last_visit.visitTime;
        hist_visit_count = arr_hist.length;
    }

    if(is_tab_switch)
        transition_typ = "YASBIL_TAB_SWITCH";

    const data_row = {
        pv_event: e_name,
        pv_guid: uuidv4(),
        session_guid: get_session_id(),
        win_id: tabInfo.windowId,
        win_guid: get_win_guid(tabInfo.windowId),
        tab_id: tabId,
        tab_guid: get_tab_guid(tabId),
        tab_width: tabInfo.width,
        tab_height: tabInfo.height ,

        pv_ts: ts,
        pv_url: tabInfo.url,
        pv_title: tabInfo.title, // should be fully available
        pv_hostname: url.hostname,
        pv_rev_hostname: url.hostname.split('').reverse().join(''),
        pv_transition_type: transition_typ.toUpperCase(),
        hist_ts: hist_visit_time,
        hist_visit_ct: hist_visit_count,
        pv_srch_engine: se_info.search_engine,
        pv_srch_qry: se_info.search_query,
        sync_ts: 0,
    };

    console.log(data_row);

    await db.yasbil_session_pagevisits.add(data_row)
        .catch(function(error) {
            console.log("PageVisit Insert Error: " + error);
        });

    // update sync message to show on front end
    await update_sync_data_msg();
}















//-------------------- update_sync_data_msg -----------------
async function update_sync_data_msg()
{
    let n_sess = await db.yasbil_sessions
        .where('sync_ts').equals(0)
        .count();

    let n_pv = await db.yasbil_session_pagevisits
        .where('sync_ts').equals(0)
        .count();

    let n_tot = n_sess + n_pv;

    set_sync_rows_tot(n_tot);

    let sync_msg = //"<i>No data available to sync.</i>" +
        "<i> Turn on logging and browse the internet to record data.</i>";

    if(n_tot > 0)
    {
        let row_counts_html =
            "<p class='text-end' style='width: 80%'>" +
            "Sessions: <b>" + n_sess + "</b> rows <br/>" +
            "Webpage Visits: <b>" + n_pv + "</b> rows <br/>" +
            "---------------------------<br/>" +
            "Total: <b>" + n_tot + "</b> rows <br/>" +
            "---------------------------" +
            "</p>";

        if(get_sync_status() === "OFF")
            sync_msg = `Data available to sync:<br/><br/>${row_counts_html}`;
        else
            sync_msg = `Data being to synced:<br/><br/>${row_counts_html}`;

    }

    set_sync_data_msg(sync_msg);
}




//-------------------- do_sync_job -----------------
// 1. check login credential; if invalid send to settings page
// 2. upload data from tables one by one
// 2.1   update progress message and row counts
// 3. delete data from loca indexed db (can this be an option in settings?)
// 3.1 update tot row counts
async function do_sync_job()
{
    // sync result:
    // PROGRESS - show progress bar
    // SUCCESS - hide progressbar
    // ERROR - hide progress bar

    try
    {
        set_sync_status('ON');
        set_sync_result('PROGRESS');
        set_sync_rows_done(0);

        // ---------- STEP 1: check login credential ----------
        set_sync_progress_msg('Verifying sync credentials...');
        let check_result = await yasbil_verify_settings();
        if(!check_result.ok)
        {
            throw new Error(`
                Invalid sync credentials. Please click 'Sync Settings'
                link below and check.
            `);
        }

        // ---------- STEP 2: syncing tables one by one ----------
        set_sync_result('PROGRESS');

        for (let i = 0; i < TABLES_TO_SYNC.length; i++)
        {
            let tbl = TABLES_TO_SYNC[i];

            set_sync_progress_msg(`Now Syncing ${tbl.nice_name}`);

            let sync_result = await sync_table_data(tbl.name, tbl.pk, tbl.api_endpoint);

            if(!sync_result.ok)
            {
                throw new Error(`
                    Error occurred while syncing ${tbl.nice_name}:
                    ${sync_result.msg}
                `);
            }
            else
            {
                increment_sync_rows_done(sync_result.num_rows_done);
                set_sync_progress_msg(`Finished syncing ${tbl.nice_name}`);
            }
        }


        // ---------- if all ends well ----------
        set_sync_result('SUCCESS');
        set_sync_progress_msg(`All data synced successfully.`);
        await update_sync_data_msg();
    }
    catch (err)
    {
        set_sync_result('ERROR');
        set_sync_progress_msg(err.toString());
    }
    finally
    {
        // let user see sync message for 10 seconds before retrying sync
        await sleep(5000);
        set_sync_status('OFF');
        //init/default condition of sync (for better UX - display of message)
        set_sync_result('INIT');
        set_sync_progress_msg('Initializing...');
        set_sync_rows_done(0);
    }
}






//-------------------- sync_table_data -----------------
/**

 - sync one table's data
 - and update sync_ts in local db

 -----------------------
   Request JSON Format:
 -----------------------
 {
    data_rows: [{row_1_obj}, {row_2_obj}, ..., {row_n_obj}],
    num_row: n
 }

 -----------------------
 Response JSON Format:
 -----------------------
 {
    sync_ts: "1614297789223",
    guids: ["49077092-8373-4fbf-8fbb-2e35ea163a22", "guid2", ..., "guid_n"]
 }
 */
async function sync_table_data(table_name, pk, api_endpoint)
{
    const sync_result = {
        ok: true,
        // resp_body_json: null, // needed?
        num_rows_done: 0,
        msg:''
    };

    try
    {
        // --------- STEP 1: SELECTing table data ---------
        const table_data = await db.table(table_name)
            .where('sync_ts').equals(0)
            .toArray();

        if(!table_data || table_data.length === 0){
            // throw new Error(`No syncable data in table`);
            return sync_result;
        }


        const num_rows_sent = table_data.length;

        // --------- STEP 2: setting up POST request ---------
        const settings = yasbil_get_settings();
        const basic_auth = btoa(settings.USER + ':' + settings.PASS);

        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Basic " + basic_auth);
        myHeaders.append("Content-Type", "application/json");

        let body_data = JSON.stringify({
            num_rows: num_rows_sent,
            data_rows: table_data
        });

        const req_options = {
            method: 'POST',
            headers: myHeaders,
            body: body_data,
            redirect: 'follow'
        };

        let req_url = settings.URL + API_NAMESPACE + api_endpoint;


        // --------- STEP 3: making request and parsing response ---------

        // fetch() requires TWO promise resolutions:
        // 1. fetch() makes a network request to the url and returns a promise.
        //    The promise resolves with a response object when the remote server
        //    responds with headers, but BEFORE the full response is downloaded.
        // 2. To read the full response, we should call the method response.text():
        //    it returns a promise that resolves when the full text is downloaded
        //    from the remote server, with that text as a result.

        const response = await fetch(req_url, req_options)
        const txt_resp = await response.text();
        const json_resp = checkJSON(txt_resp);

        if(!json_resp)
            throw new Error(`Invalid JSON: ${txt_resp}`);

        sync_result.resp_body_json = json_resp;


        // --------- STEP 4: tallying response rows with request rows ---------
        const num_rows_received = json_resp.guids.length;
        if(num_rows_sent !== num_rows_received)
            throw new Error(`Rows sent = ${num_rows_sent}; Rows received = ${num_rows_received}`);


        // --------- STEP 5: update table rows with received sync_ts ---------
        const upd_sync_ts = json_resp.sync_ts
        await db.table(table_name)
            .where(pk)
            .anyOf(json_resp.guids)
            //.where('sync_ts').equals(0)
            .modify({sync_ts: upd_sync_ts});

        sync_result.num_rows_done = num_rows_received;
        // set_sync_rows_done(num_rows_received);
        // set_sync_progress_msg(`Finished syncing ${table_nice_name || table_name}`);
    }
    catch (err)
    {
        console.log(err);
        sync_result.ok = false;
        sync_result.msg = err.toString();
    }

    return sync_result;
}
















// -------------------- Connection with Content Script -----------------
let portFromCS;

function connected(p)
{
    portFromCS = p;

    portFromCS.onMessage.addListener(async function(m)
    {
        yasbil_msg = m.yasbil_msg;

        if(yasbil_msg === "LOG_START")
        {
            await db_log_start();
        }
        else if (yasbil_msg === "LOG_END")
        {
            await db_log_end();
        }
        else if(yasbil_msg === "DO_SYNC")
        {
            do_sync_job();
        }
        else if(yasbil_msg === "__RESET_SYNC_TS")
        {
            // call from front-end by:
            // portToBG.postMessage({yasbil_msg: "__RESET_SYNC_TS"});
            __reset_sync_ts();
        }
    });
}

browser.runtime.onConnect.addListener(connected);






// -------------------- reset_sync_ts --------------------
// in case of sync error: to be called manually
// sets sync_ts = 0 in all tables
// idea: can be synced to a backup WP server with plugin installed
async function __reset_sync_ts()
{
    for (let i = 0; i < TABLES_TO_SYNC.length; i++)
    {
        let tbl = TABLES_TO_SYNC[i];

        let n_rows = await db.table(tbl.name)
            .where('sync_ts').notEqual(0)
            .modify({sync_ts: 0});

        console.log(`Resetting ${tbl.name}; Num rows = ${n_rows}`);
    }

    await update_sync_data_msg();
}









// browser.browserAction.onClicked.addListener(function() {
//     portFromCS.postMessage({greeting: "they clicked the button!"});
// });



//-------------------- Session Details -----------------
// function logSessionSTart(){
//
// }


// function logURL(requestDetails) {
//     console.log("YASBIL Loading: " + requestDetails.url);
// }
//
// browser.webRequest.onBeforeRequest.addListener(
//     logURL,
//     {urls: ["<all_urls>"]}
// );




/******************* TRANSITION TYPES ******************************/
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionType

/**
    "LINK"
        The user clicked a link in another page.
    "TYPED"
        The user typed the URL into the address bar. This is also used if the user started typing into the address bar, then selected a URL from the suggestions it offered. See also "generated".
    "AUTO_BOOKMARK"
        The user clicked a bookmark or an item in the browser history.
    "AUTO_SUBFRAME"
        Any nested iframes that are automatically loaded by their parent.
    "MANUAL_SUBFRAME"
        Any nested iframes that are loaded as an explicit user action. Loading such an iframe will generate an entry in the back/forward navigation list.
    "GENERATED"
        The user started typing in the address bar, then clicked on a suggested entry that didn't contain a URL.
    "START_PAGE"
        The page was passed to the command line or is the start page.
    "FORM_SUBMIT"
        The user submitted a form. Note that in some situations, such as when a form uses a script to submit its contents, submitting a form does not result in this transition type.
    "RELOAD"
        The user reloaded the page, using the Reload button or by pressing Enter in the address bar. This is also used for session restore and reopening closed tabs.
    "KEYWORD"
        The URL was generated using a keyword search configured by the user.
    "KEYWORD_GENERATED"
        Corresponds to a visit generated for a keyword.


    "YASBIL_TAB_SWITCH"
        user opens a new tab (url = about:newtab or sth similar)
        OR
        user goes back to a previously opened tab (no webNavigation event)


 TRANSITION QUALIFIER
 "client_redirect":
    Redirect(s) caused by JavaScript running in the page or a "refresh" pragma in the page's meta tag.
 "server_redirect":
    Redirect(s) caused by a 3XX HTTP status code sent from the server.
 "forward_back"
    The user used the forward or back button to trigger the navigation.
 "from_address_bar"
    The user triggered the navigation from the address bar.

 */
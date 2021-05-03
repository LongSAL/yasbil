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
set_session_guid("0");
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
// in utility.js





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

    await db.yasbil_sessions.add(data_row).then(async function()
    {
        set_session_guid(session_guid);

        await update_sync_data_msg();

        //***** add listeneres --> start logging ********
        // 1a. log "normal" page visits
        browser.webNavigation.onCompleted.addListener(listener_webNav_onCompleted);

        //1b. log other webnav events as timing signal
        browser.webNavigation.onBeforeNavigate.addListener(listener_webNav_onBefNav);
        browser.webNavigation.onCommitted.addListener(listener_webNav_onCommit);
        browser.webNavigation.onDOMContentLoaded.addListener(listener_webNav_onDOMLoad);

        // 2. log tab switches
        browser.tabs.onActivated.addListener(listener_tabs_onActivated);

        //3. log YouTube like page visitss
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

    browser.webNavigation.onBeforeNavigate.removeListener(listener_webNav_onBefNav);
    browser.webNavigation.onCommitted.removeListener(listener_webNav_onCommit);
    browser.webNavigation.onDOMContentLoaded.removeListener(listener_webNav_onDOMLoad);

    browser.tabs.onActivated.removeListener(listener_tabs_onActivated);
    browser.webNavigation.onHistoryStateUpdated.removeListener(listener_webNav_onHistUpd);

    // start the database update
    let session_guid = get_session_guid();

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
        set_session_guid("0");

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





//-------------------- log pagevisits method #1a -----------------
// Fired when a document, including the resources it refers to, is completely loaded
// and initialized. This is equivalent to the DOM 'load' event.
// event details: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onCompleted
// tab details: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
// history visittem: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history/VisitItem
function listener_webNav_onCompleted(details)
{
    // console.log('webNavigation.onCompleted');
    // only for top level frame: main browsing context
    if(details.frameId === 0)
    {
        db_log_pagevisits(
            details.tabId,
            details.timeStamp,
            'webNavigation.onCompleted'
        );
    }

    //for all frames
    db_log_webnav_events(
        details.tabId,
        details.frameId,

        'webNavigation.onCompleted',
        details.timeStamp,
        details.url,
        "",
        "",
    );
}

//-------------------- log webnav events -----------------
function listener_webNav_onBefNav(details)
{
    // no need to await
    db_log_webnav_events(
        details.tabId,
        details.frameId,
        'webNavigation.onBeforeNavigate',
        details.timeStamp,
        details.url,
        "",
        "",
    );
}

//-------------------- log webnav events -----------------
function listener_webNav_onCommit(details)
{
    // no need to await
    db_log_webnav_events(
        details.tabId,
        details.frameId,
        'webNavigation.onCommitted',
        details.timeStamp,
        details.url,
        details.transitionType.toUpperCase(),
        details.transitionQualifiers.join('|').toUpperCase(),
    );
}

//-------------------- log webnav events -----------------
function listener_webNav_onDOMLoad(details)
{
    // no need to await
    db_log_webnav_events(
        details.tabId,
        details.frameId,
        'webNavigation.onDOMContentLoaded',
        details.timeStamp,
        details.url,
        "",
        "",
    );
}



//-------------------- log tab switch (user re-visits pre opened tab) -----------------
// Fires when the active tab in a window changes. Note that the tab's
// URL may not be set at the time this event fired, but you can listen
// to tabs.onUpdated events to be notified when a URL is set.
// event details: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onActivated
function listener_tabs_onActivated(details)
{
    // console.log('tabs.onActivated');

    db_log_pagevisits(
        details.tabId,
        new Date().getTime(), //current timestamp
        'tabs.onActivated',
        true
    );
}




//-------------------- log YouTube like webpage visits? -----------------
// event docs: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onHistoryStateUpdated
function listener_webNav_onHistUpd(details)
{
    // console.log('webNavigation.onHistoryStateUpdated');

    // note:
    // onHistoryStateUpdated is often fired twice by Google SERPs
    // it is fired once by YouTube
    // it is not fired by many webpages

    db_log_pagevisits(
        details.tabId,
        details.timeStamp,
        'webNavigation.onHistoryStateUpdated',
    );
}





// -------------------- db_log_pagevisits --------------------
// single helper function to log pagevisits
// takes tabId, timestamp of visit, event-name that triggered this,
// and optionally, if tab-switch
async function db_log_pagevisits(tabId, ts, e_name, is_tab_switch=false)
{
    // TODO: get CURRENT tab info from where extension is switched on

    const tabInfo = await browser.tabs.get(tabId);

    // do no track certain blocked domains (e.g. gmail, about:, etc)
    if(!is_tracking_allowed(tabInfo.url))
        return;

    const url = new URL(tabInfo.url);

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

    // get page text and HTML
    // executeScript() returns array of objects = result of the script in every injected frame
    const page_text = await browser.tabs.executeScript(
        tabId,
        {code: 'document.body.innerText;'}
    );

    const page_html = await browser.tabs.executeScript(
        tabId,
        {code: 'document.body.innerHTML;'}
    );

    const data_row = {
        pv_event: e_name,
        pv_guid: uuidv4(),
        session_guid: get_session_guid(),
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

        pv_page_text: page_text[0], // taking the first element
        pv_page_html: page_html[0],

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
    // no need to await
    update_sync_data_msg();
}








// -------------------- db_log_mousedata --------------------
async function db_log_mouse(yasbil_ev_data, tabInfo, p_url)
{
    // do no track certain blocked domains (e.g. gmail, about:, etc)
    if(!is_tracking_allowed(p_url || tabInfo.url))
        return;

    // console.log(yasbil_ev_data);

    const data_row = {
        m_guid: uuidv4(),
        session_guid: get_session_guid(),
        win_id: tabInfo.windowId,
        win_guid: get_win_guid(tabInfo.windowId),
        tab_id: tabInfo.id,
        tab_guid: get_tab_guid(tabInfo.id),

        m_event: yasbil_ev_data.e_name,
        m_url: p_url || tabInfo.url,
        m_ts: yasbil_ev_data.e_ts,

        zoom: yasbil_ev_data.zoom,
        page_w: yasbil_ev_data.page_w,
        page_h: yasbil_ev_data.page_h,
        page_x: yasbil_ev_data.page_x,
        page_y: yasbil_ev_data.page_y,
        viewport_w: yasbil_ev_data.viewport_w,
        viewport_h: yasbil_ev_data.viewport_h,
        browser_w: yasbil_ev_data.browser_w,
        browser_h: yasbil_ev_data.browser_h,

        mouse_x: yasbil_ev_data.mouse_x,
        mouse_y: yasbil_ev_data.mouse_y,
        hover_dur: yasbil_ev_data.hover_dur,

        dom_path: yasbil_ev_data.dom_path,
        target_text: yasbil_ev_data.target_text,
        target_html: yasbil_ev_data.target_html,
        closest_a_text: yasbil_ev_data.closest_a_text,
        closest_a_html: yasbil_ev_data.closest_a_html,

        sync_ts: 0,
    };

    console.log(data_row);

    await db.yasbil_session_mouse.add(data_row)
        .catch(function(error) {
            console.log("Mouse Insert Error: " + error);
        });
}









// -------------------- db_log_webnav_events --------------------
// captures webnavigation events as timing signals
async function db_log_webnav_events(
    p_tab_id,
    p_frame_id,

    p_webnav_event,
    p_webnav_ts,
    p_webnav_url,
    p_webnav_transition_type,
    p_webnav_transition_qual,
)
{
    // do no track certain blocked domains (e.g. gmail, about:, etc)
    if(!is_tracking_allowed(p_webnav_url))
        return;

    // console.log(yasbil_ev_data);


    const data_row = {
        webnav_guid: uuidv4(),
        session_guid: get_session_guid(),
        tab_id: p_tab_id,
        tab_guid: get_tab_guid(p_tab_id),
        frame_id: p_frame_id,

        webnav_event: p_webnav_event,
        webnav_ts: p_webnav_ts,
        webnav_url: p_webnav_url,
        webnav_transition_type: p_webnav_transition_type,
        webnav_transition_qual: p_webnav_transition_qual,

        sync_ts: 0,
    };

    console.log(data_row);

    await db.yasbil_session_webnav.add(data_row)
        .catch(function(error) {
            console.log("WebNav Insert Error: " + error);
        });
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
        await sleep(10000);
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
















// -------------------- Connection with Popup Script -----------------
browser.runtime.onConnect.addListener(listener_runtime_onConnect);

function listener_runtime_onConnect(p)
{
    //console.log('runtime.onConnect', new Date().getTime());
    // you may distinguish different connections by Port
    // https://stackoverflow.com/a/36465331

    // https://stackoverflow.com/a/40991056
    p.onMessage.addListener(async function(m, sendingPort)
    {
        const yasbil_msg = m.yasbil_msg;
        console.log(`YASBIL_MSG = ${yasbil_msg}`);
        console.log(m);

        const is_logging = (get_session_guid() !== "0") ;
        const is_syncing = (get_sync_status() === "ON");

        // ----- NOT logging; NOT syncing -----
        if(!is_logging && !is_syncing)
        {
            if(yasbil_msg === "LOG_START") {
                await db_log_start();
            }
            else if(yasbil_msg === "DO_SYNC") {
                do_sync_job();
            }
            else if(yasbil_msg === "__RESET_SYNC_TS") {
                // call from front-end by:
                // portToBG.postMessage({yasbil_msg: "__RESET_SYNC_TS"});
                __reset_sync_ts();
            }
        }
        // ----- logging; NOT syncing -----
        else if(is_logging && !is_syncing)
        {
            if (yasbil_msg === "DB_LOG_MOUSE") {
                db_log_mouse(
                    m.yasbil_ev_data,
                    sendingPort.sender.tab,
                    sendingPort.url
                ); //don't await (?) to let it run in BG?
            }
            else if (yasbil_msg === "LOG_END") {
                await db_log_end();
            }
        }
        // ----- syncing; NOT logging -----
        else if(!is_logging && is_syncing)
        {
            //what message can arise here?
        }
        // ----- 4th situation logging AND syncing NOT allowed -----

    });
}








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










/** --------------  unused code ----------------  */
// -------------------- db_log_page_text --------------------
/*********
 async function db_log_page_text(tabInfo, ts, e_name)
 {

    const session_guid = get_session_guid();
    const url = tabInfo.url;

    // returns 0 or count
    const row_exists = await db.yasbil_session_pagetext
        .where('[session_guid+url]')
        .equals([session_guid, url])
        .count();

    console.log('log pagetext row exists?:');
    console.log(row_exists);

    if(!row_exists)
    {
        //returns array of objects = result of the script
        // in every injected frame
        const page_text = await browser.tabs.executeScript(
            tabInfo.id,
            {code: 'document.body.innerText;'}
        );

        const data_row = {
            pt_guid: uuidv4(),
            session_guid: session_guid,
            url: url,
            page_text: page_text[0], // taking the first element
            crt_ts: ts, //same as pv_ts //new Date().getTime(),
            sync_ts: 0,
        };

        console.log(data_row);

        await db.yasbil_session_pagetext.add(data_row)
            .catch(function(error) {
                console.log("PageText Insert Error: " + error);
            });
    }
}
 *************/
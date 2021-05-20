/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-01-25
 * Time: 10:13 AM CDT
 */



import * as db from './yasbil_00_db.js';

// initial state of browser extension: false
console.log('Initializing YASBIL extn');
set_session_guid("0");
set_sync_status("OFF");



// -------------------- Connection with UI / Content Scripts -----------------
browser.runtime.onConnect.addListener(listener_runtime_onConnect);

function listener_runtime_onConnect(p)
{
    // you may distinguish different connections by Port
    // https://stackoverflow.com/a/36465331
    // https://stackoverflow.com/a/40991056
    p.onMessage.addListener(async function(m, sendingPort)
    {
        try
        {
            const yasbil_msg = m.yasbil_msg;
            // console.log(`YASBIL_MSG = ${yasbil_msg}`);
            // console.log(m);

            const extn_state = get_extn_state();

            const is_logging = extn_state.is_logging ;
            const is_syncing = extn_state.is_syncing;

            // ----- NOT logging; NOT syncing -----
            if(!is_logging && !is_syncing)
            {
                if(yasbil_msg === "LOG_START")
                {
                    await log_start(); //sendingPort.sender.tab);
                }
                else if(yasbil_msg === "DO_SYNC")
                {
                    db.do_sync_job();
                }
                else if(yasbil_msg === "__RESET_SYNC_TS")
                {
                    // call from front-end by:
                    // portToBG.postMessage({yasbil_msg: "__RESET_SYNC_TS"});
                    //__reset_sync_ts();
                }
            }
            // ----- logging; NOT syncing -----
            else if(is_logging && !is_syncing)
            {
                if (yasbil_msg === "LOG_MOUSE_AND_SCROLL")
                {
                    log_mouse_and_scroll(
                        m.yasbil_ev_data,
                        sendingPort.sender.tab,
                        sendingPort.url
                    ); //don't await (?) to let it run in BG?
                }
                else if (yasbil_msg === "LOG_SERP")
                {
                    log_serp(
                        m.yasbil_serp_data,
                        sendingPort.sender.tab,
                        sendingPort.url
                    ); //don't await (?) to let it run in BG?
                }
                else if (yasbil_msg === "LOG_END")
                {
                    await log_end();
                }
            }
            // ----- syncing; NOT logging -----
            else if(!is_logging && is_syncing)
            {
                //what message can arise here?
            }
            // ----- 4th situation logging AND syncing NOT allowed -----
        }
        catch (err)
        {
            console.error(err);
        }
    });
}


//-------------------- Start (YASBIL) Logging Session -----------------
async function log_start() //tabInfo)
{
    const session_guid = uuidv4();

    const platform_info = await browser.runtime.getPlatformInfo();

    // TODO: get for other browsers?
    const browser_info = await browser.runtime.getBrowserInfo();

    const session_start_ts = new Date().getTime();

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
        session_start_ts: session_start_ts, //TODO: check time from internet time server?
        session_end_ts: 0,
        sync_ts: 0,
    };

    await db.insert_row(
        'yasbil_sessions',
        data_row,
        true
    );

    set_session_guid(session_guid);

    //***** add listeneres --> start logging ********
    // 1a. log "normal" page visits
    browser.webNavigation.onCompleted.addListener(listener_webNav_onCompleted);

    //1b. log other webnav events as timing signal
    browser.webNavigation.onBeforeNavigate.addListener(listener_webNav_onBefNav);
    browser.webNavigation.onCommitted.addListener(listener_webNav_onCommit);
    browser.webNavigation.onDOMContentLoaded.addListener(listener_webNav_onDOMLoad);

    // 2. log tab switches
    browser.tabs.onActivated.addListener(listener_tabs_onActivated);

    //3. log YouTube like page visits
    browser.webNavigation.onHistoryStateUpdated.addListener(listener_webNav_onHistUpd);

    //4. log all currently open tabs as initial page visit
    // capture more data than less
    const arr_all_tabs = await browser.tabs.query({});
    //const arr_active_tabs = await browser.tabs.query({currentWindow: true, active: true});

    for(let tab of arr_all_tabs)
    {
        log_pagevisits(
            tab.id,
            session_start_ts, //current timestamp
            'YASBIL_SESSION_START',
            'YASBIL_SESSION_START',
        );
    }

    // change icon to logging-on icon
    browser.browserAction.setIcon({
        path : "icon/yasbil-icon-logging.png"
    });

    browser.browserAction.setTitle({
        title : "YASBIL is ON"
    });

    db.update_sync_data_msg();

    console.log('Session Start Insert Success: Woot! Did it');
}




//-------------------- End (YASBIL) Logging Session -----------------
async function log_end()
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
        await db.end_session();

        // todo: do housekeeping
        //   1. if there's no pagevisits or interactions,
        //      delete this session?
        //   2. delete if session is less than threshold?(e.g. 30 s?)


        // Success - the data is updated!
        set_session_guid("0");

        db.update_sync_data_msg();

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
        log_pagevisits(
            details.tabId,
            details.timeStamp,
            'webNavigation.onCompleted'
        );

        log_webnav(
            details.tabId,
            //details.frameId,
            'onCompleted',
            details.timeStamp,
            details.url,
            "",
            "",
        );
    }

    // [No use] for all frames

}

//-------------------- log webnav events -----------------
function listener_webNav_onBefNav(details)
{
    if(details.frameId === 0)
    {
        // no need to await
        log_webnav(
            details.tabId,
            //details.frameId,
            'onBeforeNavigate',
            details.timeStamp,
            details.url,
            "",
            "",
        );
    }

}

//-------------------- log webnav events -----------------
function listener_webNav_onCommit(details)
{
    if(details.frameId === 0)
    {
        // no need to await
        log_webnav(
            details.tabId,
            //details.frameId,
            'onCommitted',
            details.timeStamp,
            details.url,
            details.transitionType.toUpperCase(),
            details.transitionQualifiers.join('|').toUpperCase(),
        );
    }
}


//-------------------- log webnav events -----------------
function listener_webNav_onDOMLoad(details)
{
    if(details.frameId === 0)
    {
        // no need to await
        log_webnav(
            details.tabId,
            //details.frameId,
            'onDOMContentLoaded',
            details.timeStamp,
            details.url,
            "",
            "",
        );
    }
}



//-------------------- log tab switch (user re-visits pre opened tab) -----------------
// Fires when the active tab in a window changes. Note that the tab's
// URL may not be set at the time this event fired, but you can listen
// to tabs.onUpdated events to be notified when a URL is set.
// event details: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onActivated
function listener_tabs_onActivated(details)
{
    // console.log('tabs.onActivated');

    log_pagevisits(
        details.tabId,
        new Date().getTime(), //current timestamp
        'tabs.onActivated',
        'YASBIL_TAB_SWITCH',
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

    if(details.frameId === 0)
    {
        // HTML may not have been updated when
        // onHistoryStateUpdated is fired

        await sleep(DELAY_AFTER_HIST_UPD);

        log_pagevisits(
            details.tabId,
            details.timeStamp,
            'webNavigation.onHistoryStateUpdated',
        );

        // no need to await
        log_webnav(
            details.tabId,
            //details.frameId,
            'onHistoryStateUpdated',
            details.timeStamp,
            details.url,
            "",
            "",
        );
    }
}


// -------------------- log_pagevisits --------------------
// single helper function to log pagevisits
// takes tabId, timestamp of visit, event-name that triggered this,
// and optionally, if tab-switch
async function log_pagevisits(tabId, ts, e_name, p_tran_typ= null)
{
    const tabInfo = await browser.tabs.get(tabId);

    // do no track certain blocked domains (e.g. gmail, about:, etc)
    if(!is_tracking_allowed(tabInfo.url))
        return;

    //identify popular search engines and get search query from URL
    const se_info = get_search_engine_info(tabInfo.url);

    const url = new URL(tabInfo.url);

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

    if(p_tran_typ)
        transition_typ = p_tran_typ;

    // get page text and HTML
    // executeScript() returns array of objects
    // = result of the script running in every injected frame
    const page_text = await browser.tabs.executeScript(
        tabId,
        {code: 'document.documentElement.innerText;'}
    );

    const page_html = await browser.tabs.executeScript(
        tabId,
        //outer HTML gets entire HTML
        {code: 'document.documentElement.outerHTML;'}
    );

    //TODO: get opengraph tags

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

        // taking the first element
        pv_page_text: await db.string2hash(page_text[0]),
        pv_page_html: await db.string2hash(page_html[0], true),

        //TODO: opengraph tags

        hist_ts: hist_visit_time,
        hist_visit_ct: hist_visit_count,
        pv_search_engine: se_info.search_engine,
        pv_search_query: se_info.search_query,
        sync_ts: 0,
    };

    // console.log(data_row);

    await db.insert_row('yasbil_session_pagevisits', data_row,true);
}




// -------------------- log_mouse and scroll --------------------
async function log_mouse_and_scroll(yasbil_ev_data, tabInfo)
{
    // do no track certain blocked domains (e.g. gmail, about:, etc)
    if(!is_tracking_allowed(tabInfo.url))
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
        m_url: tabInfo.url,
        m_ts: yasbil_ev_data.e_ts,

        zoom: yasbil_ev_data.zoom,
        page_w: yasbil_ev_data.page_w,
        page_h: yasbil_ev_data.page_h,
        viewport_w: yasbil_ev_data.viewport_w,
        viewport_h: yasbil_ev_data.viewport_h,
        browser_w: yasbil_ev_data.browser_w,
        browser_h: yasbil_ev_data.browser_h,

        page_scrolled_x: yasbil_ev_data.page_scrolled_x,
        page_scrolled_y: yasbil_ev_data.page_scrolled_y,
        mouse_x: yasbil_ev_data.mouse_x,
        mouse_y: yasbil_ev_data.mouse_y,
        hover_dur: yasbil_ev_data.hover_dur,

        dom_path: await db.string2hash(yasbil_ev_data.dom_path),
        target_text: await db.string2hash(yasbil_ev_data.target_text),
        target_html: await db.string2hash(yasbil_ev_data.target_html),
        closest_a_text: await db.string2hash(yasbil_ev_data.closest_a_text),
        closest_a_html: await db.string2hash(yasbil_ev_data.closest_a_html),

        sync_ts: 0,
    };

    db.insert_row('yasbil_session_mouse', data_row);
}






// -------------------- log_serp --------------------
async function log_serp(yasbil_serp_data, tabInfo)
{
    try
    {
        // do no track certain blocked domains (e.g. gmail, about:, etc)
        if(!is_tracking_allowed(tabInfo.url))
            return;

        // compress largestring in scraped_json_arr
        for(let arr_i of yasbil_serp_data.scraped_json_arr)
        {
            if(arr_i.inner_text)
                arr_i.inner_text = await db.string2hash(arr_i.inner_text);

            if(arr_i.inner_html)
                arr_i.inner_html = await db.string2hash(arr_i.inner_html, true);
        }

        const data_row = {
            serp_guid: uuidv4(),
            session_guid: get_session_guid(),
            win_id: tabInfo.windowId,
            win_guid: get_win_guid(tabInfo.windowId),
            tab_id: tabInfo.id,
            tab_guid: get_tab_guid(tabInfo.id),

            serp_ts: yasbil_serp_data.serp_ts,
            serp_url: yasbil_serp_data.serp_url,
            search_engine: yasbil_serp_data.search_engine,
            search_query: yasbil_serp_data.search_query,
            serp_offset: yasbil_serp_data.serp_offset,

            scraped_json_arr: yasbil_serp_data.scraped_json_arr,


            zoom: yasbil_serp_data.zoom,
            page_w: yasbil_serp_data.page_w,
            page_h: yasbil_serp_data.page_h,
            viewport_w: yasbil_serp_data.viewport_w,
            viewport_h: yasbil_serp_data.viewport_h,
            browser_w: yasbil_serp_data.browser_w,
            browser_h: yasbil_serp_data.browser_h,

            sync_ts: 0,
        };

        db.insert_row('yasbil_session_serp', data_row);

        //console.log(yasbil_serp_data.scraped_json_arr);
    }
    catch (err)
    {
        console.error(err);
    }
}







// -------------------- log_webnav --------------------
// captures webnavigation events as timing signals
function log_webnav(
    p_tab_id,
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

        webnav_event: p_webnav_event,
        webnav_ts: p_webnav_ts,
        webnav_url: p_webnav_url,
        webnav_transition_type: p_webnav_transition_type,
        webnav_transition_qual: p_webnav_transition_qual,

        sync_ts: 0,
    };

    db.insert_row('yasbil_session_webnav', data_row);
}










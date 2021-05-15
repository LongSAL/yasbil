/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-14
 * Time: 09:45 AM CDT
 *
 * Util functions that do not depend on DB
 * should only import constants
 */

import * as yasbil_constants from 'yasbil_00_constants';


//-------------------- get session GUID: returns "0" if not in session -----------------
// localstorage can only store strings
export function get_session_guid()  {
    return localStorage.getItem('YASBIL_SESSION_GUID');
}

//-------------------- set session GUID -----------------
export function set_session_guid(p_session_guid) {
    localStorage.setItem('YASBIL_SESSION_GUID',  p_session_guid.trim());
}

export function get_extn_state()
{
    const is_logging = (get_session_guid() !== "0") ;
    const is_syncing = (get_sync_status() === "ON");

    return {
        is_logging, is_syncing
    }
}

// these are internal to utils
let _ARR_WIN_GUID = {};
let _ARR_TAB_GUID = {};

//-------------------- returns guid of a given window ID -----------------
// if win_id is not present (new window), creates a new guid and returns it
export function get_win_guid(p_win_id)
{
    if(!_ARR_WIN_GUID.hasOwnProperty(p_win_id)){
        _ARR_WIN_GUID[p_win_id] = uuidv4();
    }
    return _ARR_WIN_GUID[p_win_id];
}

//-------------------- returns guid of a given tab ID -----------------
// if tab_id is not present (new tab), creates a new guid and returns it
export function get_tab_guid(p_tab_id)
{
    if(!_ARR_TAB_GUID.hasOwnProperty(p_tab_id)){
        _ARR_TAB_GUID[p_tab_id] = uuidv4();
    }
    return _ARR_TAB_GUID[p_tab_id];
}

//-------------------- get_search_engine_info -----------------
// tries to identify search engine and search query from URL
export function get_search_engine_info(p_url_str)
{
    const res = {search_engine: '', search_query: ''};
    const a = new URL(p_url_str);

    for(let se_item of yasbil_constants.ARR_SEARCH_ENGINES)
    {
        if(a.hostname.includes(se_item.host) && a.searchParams.get(se_item.url_param))
        {
            res.search_engine = se_item.se_name;
            res.search_query = a.searchParams.get(se_item.url_param);
            break;
        }
    }

    // if no match occurs, then try to see if "common" url params exist in URL
    if(!res.search_engine)
    {
        for(let param_name of yasbil_constants.ARR_COMMON_SEARCH_URL_PARAMS)
        {
            if(a.searchParams.get(param_name))
            {
                res.search_engine = a.hostname;
                res.search_query = a.searchParams.get(param_name);
                break;
            }
        }
    }

    return res;
}


//-------------------- is_tracking_allowed -----------------
// returns if tracking is allowed, checks against a blocklist
export function is_tracking_allowed(p_url_str)
{
    let res = true;
    const a = new URL(p_url_str);

    if(a.hostname.length < 1)
    {
        res = false;
    }
    else
    {
        for(let d of yasbil_constants.ARR_URL_BLOCKLIST)
        {
            if(a.hostname.startsWith(d) || a.protocol.startsWith(d))
            {
                res = false;
                console.log(`NO TRACKING: ${a.href}`);
                break;
            }
        }
    }

    return res;
}


//_________________________ start: SETTINGS related meta ___________________________
// store: WP base URL, WP username, WP APP Password
// var 'YASBIL_WP_URL' = "YASBIL_WP_URL";
// var 'YASBIL_WP_USER' = "YASBIL_WP_USER";
// var 'YASBIL_WP_PASS' = "YASBIL_WP_PASS";

export function yasbil_save_settings(p_url, p_user, p_pass) {
    localStorage.setItem('YASBIL_WP_URL',  p_url.trim());
    localStorage.setItem('YASBIL_WP_USER',  p_user.trim());
    localStorage.setItem('YASBIL_WP_PASS',  p_pass.trim());
}

export function yasbil_get_settings() {
    return {
        URL: localStorage.getItem('YASBIL_WP_URL') || 'https://www.wordpress.org',
        USER: localStorage.getItem('YASBIL_WP_USER') || 'DEFAULT',
        PASS: localStorage.getItem('YASBIL_WP_PASS') || 'DEFAULT'
    }
}

// ------------- check the saved settings with remote WordPress ------------
// checks whether YASBIL endpoint is reachable (not just mere presence of WordPress)
export async function yasbil_verify_settings()
{
    const settings = yasbil_get_settings();

    // delete cookies associated with Wordpress URL
    // (espedially if user is logged in to that wordpress installation)

    const all_cookies = await browser.cookies.getAll({
        domain: new URL(settings.URL).hostname
    });

    for(let ith_cookie of all_cookies)
    {
        // delete all cookies except wordpress test cookie
        // wordpress test cookie is used to check if
        // cookie is supported by browser
        if(ith_cookie.name !== 'wordpress_test_cookie')
        {
            const deleted_cookie = await browser.cookies.remove({
                url: settings.URL,
                name: ith_cookie.name
            });
            //console.log('deleting cookie', deleted_cookie);
        }
    }

    const basic_auth = btoa(settings.USER + ':' + settings.PASS);

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Basic " + basic_auth);

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    const req_url = settings.URL
        + yasbil_constants.API_NAMESPACE
        + yasbil_constants.CHECK_CONNECTION_ENDPOINT;

    // fetch() requires TWO promise resolutions:
    // 1. fetch() makes a network request to the url and returns a promise.
    //    The promise resolves with a response object when the remote server
    //    responds with headers, but BEFORE the full response is downloaded.
    // 2. To read the full response, we should call the method response.text():
    //    it returns a promise that resolves when the full text is downloaded
    //    from the remote server, with that text as a result.

    const check_result = {ok: true, msg: ''};

    try
    {
        const response = await fetch(req_url, requestOptions);
        check_result.ok = response.ok;

        const txt_resp = await response.text();
        const json_resp = checkJSON(txt_resp);

        // if invalid json response
        if(!json_resp)
            throw new Error('[E001] No response from server. Check server URL.');

        // check if response has a propoerty code
        if(json_resp.hasOwnProperty('code'))
        {
            if(json_resp.code === 'invalid_username' || json_resp.code === 'incorrect_password')
                throw new Error('[E002] Invalid username / password combination.');

            // if code is not yasbil_connection_succss
            // (in class-yasbil-wp-admin.php --> yasbil_sync_check_connection() )
            if(json_resp.code !== 'yasbil_connection_success')
                throw new Error('[E003] User Disabled. Please contact researcher.');
        }
        else {
            throw new Error('[E004]: Invalid Server URL.');
        }
    }
    catch (err)
    {
        check_result.ok = false;
        check_result.msg = err.toString();

        if(check_result.msg.includes('NetworkError'))
            check_result.msg = 'Invalid Server URL';
    }

    return check_result;

}


//_________________________ end: SETTINGS related meta ___________________________


//_________________________ start: SYNCING related meta ___________________________

export function get_sync_status() {
    return localStorage.getItem('YASBIL_SYNC_STATUS');
}

export function set_sync_status(p_sync_status) {
    localStorage.setItem('YASBIL_SYNC_STATUS', p_sync_status.trim());
}

export function get_sync_data_msg() {
    return localStorage.getItem('YASBIL_SYNC_DATA_MSG');
}

export function set_sync_data_msg(p_sync_msg) {
    localStorage.setItem('YASBIL_SYNC_DATA_MSG',  p_sync_msg.trim());
}

export function get_sync_progress_msg() {
    return localStorage.getItem('YASBIL_SYNC_PROGRESS_MSG');
}

export function set_sync_progress_msg(p_sync_msg) {
    localStorage.setItem('YASBIL_SYNC_PROGRESS_MSG',  p_sync_msg.trim());
}

export function get_sync_result() {
    return localStorage.getItem('YASBIL_SYNC_RESULT');
}

export function set_sync_result(p_sync_result) {
    localStorage.setItem('YASBIL_SYNC_RESULT',  p_sync_result.trim());
}


//_________________________ end: SYNCING related meta ___________________________


//-------------------- generate GUID / UUID -----------------
// https://stackoverflow.com/a/2117523
export function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

//-------------------- hack sleep() function -----------------
//https://stackoverflow.com/a/39914235
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ------- return valid JSON or false --------------
export function checkJSON(str) {
    try {
        return JSON.parse(str)
    } catch (e) {
        return false
    }
}

// ------------ display unix timestamp in human readable format -----------
export function yasbil_milli_to_str(ms)
{
    if(ms === 0)
        return "x";

    return new Date(ms)
        .toISOString()
        .replace('T', ' ');
}


















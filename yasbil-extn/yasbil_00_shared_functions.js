/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-14
 * Time: 09:45 AM CDT
 *
 * Util functions that do not depend on DB
 */




//-------------------- get session GUID: returns "0" if not in session -----------------
// localstorage can only store strings
function get_session_guid()  {
    return localStorage.getItem('YASBIL_SESSION_GUID');
}

//-------------------- set session GUID -----------------
function set_session_guid(p_session_guid) {
    localStorage.setItem('YASBIL_SESSION_GUID',  p_session_guid.trim());
}

function get_extn_state()
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
function get_win_guid(p_win_id)
{
    if(!_ARR_WIN_GUID.hasOwnProperty(p_win_id)){
        _ARR_WIN_GUID[p_win_id] = uuidv4();
    }
    return _ARR_WIN_GUID[p_win_id];
}

//-------------------- returns guid of a given tab ID -----------------
// if tab_id is not present (new tab), creates a new guid and returns it
function get_tab_guid(p_tab_id)
{
    if(!_ARR_TAB_GUID.hasOwnProperty(p_tab_id)){
        _ARR_TAB_GUID[p_tab_id] = uuidv4();
    }
    return _ARR_TAB_GUID[p_tab_id];
}

//-------------------- get_search_engine_info -----------------
// tries to identify search engine and search query from URL
// serp_offset == 0 --> first page of SERP
function get_search_engine_info(p_url_str)
{
    const res = {search_engine: '', search_query: '', serp_offset: 0};
    const a = new URL(p_url_str);

    for(let se_item of ARR_SEARCH_ENGINES)
    {
        if(a.hostname.includes(se_item.host) && a.searchParams.get(se_item.qry))
        {
            res.search_engine = se_item.se_name;
            res.search_query = a.searchParams.get(se_item.qry);

            if(a.searchParams.get(se_item.pg))
                res.serp_offset = a.searchParams.get(se_item.pg);

            break;
        }
    }

    // if no match occurs, then try to see if "common" url params exist in URL
    if(!res.search_engine)
    {
        for(let param_name of ARR_COMMON_SEARCH_URL_PARAMS)
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
function is_tracking_allowed(p_url_str)
{
    if(!p_url_str) //if empty string
        return true;

    let res = true;
    const a = new URL(p_url_str);

    if(a.hostname.length < 1)
    {
        res = false;
    }
    else
    {
        for(let d of ARR_URL_BLOCKLIST)
        {
            if(a.hostname.startsWith(d) || a.protocol.startsWith(d))
            {
                res = false;
                // console.log(`NO TRACKING: ${a.href}`);
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

function yasbil_save_settings(p_url, p_user, p_pass) {
    localStorage.setItem('YASBIL_WP_URL',  p_url.trim());
    localStorage.setItem('YASBIL_WP_USER',  p_user.trim());
    localStorage.setItem('YASBIL_WP_PASS',  p_pass.trim());
}

function yasbil_get_settings() {
    return {
        URL: localStorage.getItem('YASBIL_WP_URL') || 'https://www.wordpress.org',
        USER: localStorage.getItem('YASBIL_WP_USER') || 'DEFAULT',
        PASS: localStorage.getItem('YASBIL_WP_PASS') || 'DEFAULT'
    }
}

// ------------- check the saved settings with remote WordPress ------------
// checks whether YASBIL endpoint is reachable (not just mere presence of WordPress)
async function yasbil_verify_settings()
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

    const req_url = settings.URL + API_NAMESPACE + CHECK_CONNECTION_ENDPOINT;

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

function get_sync_status() {
    return localStorage.getItem('YASBIL_SYNC_STATUS');
}

function set_sync_status(p_sync_status) {
    localStorage.setItem('YASBIL_SYNC_STATUS', p_sync_status.trim());
}

function get_sync_rows_tot() {
    return parseInt(localStorage.getItem('YASBIL_SYNC_N_ROWS_TOT'));
}

function set_sync_rows_tot(p_sync_rows_tot) {
    localStorage.setItem('YASBIL_SYNC_N_ROWS_TOT', p_sync_rows_tot);
}

function get_sync_data_msg() {
    return localStorage.getItem('YASBIL_SYNC_DATA_MSG');
}

function set_sync_data_msg(p_sync_msg) {
    localStorage.setItem('YASBIL_SYNC_DATA_MSG',  p_sync_msg.trim());
}

function get_sync_progress_msg() {
    return localStorage.getItem('YASBIL_SYNC_PROGRESS_MSG');
}

function set_sync_progress_msg(p_sync_msg) {
    localStorage.setItem('YASBIL_SYNC_PROGRESS_MSG',  p_sync_msg.trim());
}

function get_sync_result() {
    return localStorage.getItem('YASBIL_SYNC_RESULT');
}

function set_sync_result(p_sync_result) {
    localStorage.setItem('YASBIL_SYNC_RESULT',  p_sync_result.trim());
}


//_________________________ end: SYNCING related meta ___________________________


//-------------------- generate GUID / UUID -----------------
// https://stackoverflow.com/a/2117523
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

//-------------------- hack sleep() function -----------------
//https://stackoverflow.com/a/39914235
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ------- return valid JSON or false --------------
function checkJSON(str) {
    try {
        return JSON.parse(str)
    } catch (e) {
        return false
    }
}

// ------------ display unix timestamp in human readable format -----------
function yasbil_milli_to_str(ms)
{
    try
    {
        if(ms === 0)
            return "x";

        return new Date(ms - new Date().getTimezoneOffset() * 60 * 1000)
            .toISOString()
            .replace('T', ' ')
            .replace('Z', '')
            //.slice(0, -4) //remove milliseconds
            ;
    }
    catch (err)
    {
        console.error(err);
        return "";
    }
}

// ----------- return yyyymmdd_hhmmss -----------
function get_timestamp_for_filename()
{
    try
    {
        return new Date()
            .toISOString() // "2021-05-19T00:41:02.086Z"
            .substring(0,19) // "2021-05-19T00:41:02"
            .replaceAll('-','') // "20210519T00:41:02"
            .replaceAll(':','') // "20210519T004102"
            .replaceAll('T','_') // "20210519_004102"
    }
    catch (err)
    {
        console.error(err);
        return "";
    }
}


// ------------ get_file_size -----------
// takes number of characters and
// returns KB / MB / GB
function get_file_size(num_chars)
{
    try
    {
        const _KB = 1024;
        const _MB = _KB * 1024;
        const _GB = _MB * 1024;

        let res = num_chars;

        if(num_chars >= _GB)
            res = (num_chars / _GB).toFixed(1) + 'GB';
        else if(num_chars >= _MB)
            res = (num_chars / _MB).toFixed(1) + 'MB';
        else
            res = (num_chars / _KB).toFixed(1) + 'KB'

        return res;
    }
    catch (err)
    {
        console.error(err);
        return "";
    }
}

// ----------- compress_html_string -----------
const _parser = new DOMParser();
function compress_html_string(p_html_str)
{
    try
    {
        // removes the following tags from htmlstring
        // to reduce character length, assuming these do not
        // contribute to the "content" of the page
        // for scraping / parsing after-the-fact
        const DELETE_TAGS =[
            'script',
            'style',
            'svg',
            'link',
            'img[src^="data:"]', //base64 images (unecessarily increases HTML size)
            'template',
        ];

        let result = "";

        // another try-catch block because some websites
        // blocks the loading of a resource at inline (“script-src”)
        try
        {
            const dummy_doc = _parser.parseFromString(p_html_str, "text/html");

            for(let tag of DELETE_TAGS)
            {
                dummy_doc.querySelectorAll(tag).forEach(function(item, index){
                    if(item.parentNode)
                        item.parentNode.removeChild(item);
                    else
                        item.remove();
                });
            }

            // remove all 'data-yasbil_hover_st' attributes
            dummy_doc.querySelectorAll('[data-yasbil_hover_st]').forEach(function(item, index)
            {
                delete item.dataset.yasbil_hover_st;
                //item.removeAttribute('data-yasbil_hover_st');
            });

            result = dummy_doc.documentElement.outerHTML;
        }
        catch (err) {
            //fallback to the original string
            console.log(err.toString());
            result = p_html_str;
        }

        result = result.replace(/^\s+|\r\n|\n|\r|(>)\s+(<)|\s+$/gm, '$1$2');
        result = result.replaceAll("  ", " ").replaceAll("  ", " ");

        /*if(p_html_str.length/1000 > 100)
        {
            console.log(
              'orig: ', p_html_str.length/1000, 'k ',
              'comp: ', result.length/1000, 'k ',
            );
        }*/

        return result;
    }
    catch (err2)
    {
        console.error(err2);
        return p_html_str;
    }
}

// compress_html_string(document.documentElement.outerHTML)

// ----------- deep compare 2 objects ------------
// https://stackoverflow.com/a/32922084
// function deepEqual(x, y)
// {
//     try
//     {
//         const ok = Object.keys, tx = typeof x, ty = typeof y;
//         return x && y && tx === 'object' && tx === ty ? (
//             ok(x).length === ok(y).length &&
//             ok(x).every(key => deepEqual(x[key], y[key]))
//         ) : (x === y);
//     }
//     catch (err)
//     {
//         console.error(err)
//         return "";
//     }
// }


//https://stackoverflow.com/a/6713782
function object_equals( x, y ) {
    if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

    if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for ( let p in x ) {
        if ( ! x.hasOwnProperty( p ) ) continue;
        // other properties were tested using x.constructor === y.constructor

        if ( ! y.hasOwnProperty( p ) ) return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if ( x[ p ] === y[ p ] ) continue;
        // if they have the same strict value or identity then they are equal

        if ( typeof( x[ p ] ) !== "object" ) return false;
        // Numbers, Strings, Functions, Booleans must be strictly equal

        if ( ! object_equals( x[ p ],  y[ p ] ) ) return false;
        // Objects and Arrays must be tested recursively
    }

    for ( let p in y )
        if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) )
            return false;
    // allows x[ p ] to be set to undefined

    return true;
}


// https://stackoverflow.com/a/31637900
function html_encode(e)
{
    return e.replace(/[^]/g,function(e)
    {
        return"&#"+e.charCodeAt(0)+";"
    });
}











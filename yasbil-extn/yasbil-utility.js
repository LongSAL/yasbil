/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-02-02
 * Time: 09:41 AM CDT
 */
//------------ sync constants -------------
const REQ_NAMESPACE = 'yasbil/v2_0_0';
const API_NAMESPACE = `/wp-json/${REQ_NAMESPACE}`;
const DEL_THRESH = 7 * 24 * 60 * 60 * 1000 ; // 7 days in milliseonds

const TABLES_TO_SYNC = [{
    name: 'yasbil_sessions',
    pk: 'session_guid',
    api_endpoint: '/sync_table',
    nice_name: 'Sessions'
}, {
    name: 'yasbil_session_pagevisits',
    pk: 'pv_guid',
    api_endpoint: '/sync_table',
    nice_name: 'Page Visits'
}, {
    name: 'yasbil_session_mouse',
    pk: 'm_guid',
    api_endpoint: '/sync_table',
    nice_name: 'Mouse Events'
}, {
    name: 'yasbil_session_webnav',
    pk: 'webnav_guid',
    api_endpoint: '/sync_table',
    nice_name: 'Web Events'
}
];


//-------------------- Establish Connection with Database -----------------
let db = new Dexie("yasbil_db");

db.version(1).stores({
    yasbil_sessions: 'session_guid,sync_ts',
    yasbil_session_pagevisits: 'pv_guid,sync_ts',
    yasbil_session_mouse: 'm_guid,sync_ts',
    yasbil_session_webnav: 'webnav_guid,sync_ts',
    //yasbil_session_pagetext: 'pt_guid,[session_guid+url],sync_ts',
    //yasbil_session_framevisits: 'fv_guid',
});

db.open().then(async function (db) {
    await update_sync_data_msg();
    console.log('Database opened successfully');
}).catch (function (err) {
    console.log('DB Open Error occurred');
    console.log(err);
});




//--> has to be localStorage; since content script cannot access these vars
// let _SESSION_GUID;
// localstorage can only store strings


// ---------- synchronous storage / retrieval --------------

//-------------------- get session GUID: returns "0" if not in session -----------------
function get_session_guid()  {
    return localStorage.getItem('YASBIL_SESSION_GUID');
}

//-------------------- set session GUID -----------------
function set_session_guid(p_session_guid) {
    localStorage.setItem('YASBIL_SESSION_GUID',  p_session_guid.trim());
}



// these are not needed in content scripts (are they?)
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
// tries to identify search engine from URL and the search query
function get_search_engine_info(p_url_obj)
{
    const res = {search_engine: '', search_query: ''};
    const a = p_url_obj;

    // name of search engine; hostname pattern; search query param name
    const arr_se_items = [
        { se_name: 'GOOGLE SCHOLAR', host: 'scholar.google.', url_param: 'q' },
        { se_name: 'GOOGLE', host: 'google.', url_param: 'q' },
        { se_name: 'YOUTUBE', host: 'youtube.', url_param: 'search_query' },
        { se_name: 'BING', host: 'bing.', url_param: 'q' },
        { se_name: 'DUCKDUCKGO', host: 'duckduckgo.', url_param: 'q' },
        { se_name: 'AMAZON', host: 'amazon.', url_param: 'k' },
        { se_name: 'WIKIPEDIA', host: 'wikipedia.', url_param: 'search' },
        { se_name: 'EBAY', host: 'ebay.', url_param: '_nkw' },
        { se_name: 'BAIDU', host: 'baidu.', url_param: 'wd' },
        { se_name: 'YANDEX', host: 'yandex.', url_param: 'text' },
        { se_name: 'YAHOO', host: 'yahoo.', url_param: 'p' },
        { se_name: 'FLIPKART', host: 'flipkart.', url_param: 'q' },
        { se_name: 'NAVER', host: 'naver.', url_param: 'query' }, //south korea
        { se_name: 'SEZNAM', host: 'seznam.', url_param: 'q' }, //Czech Republic
        // TODO: others? WebMD etc.?
    ];

    for(let se_item of arr_se_items)
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
        let arr_common_search_url_params = [
            'q', 'query', 'k', 'search', 'search_query'
        ];

        for(let param_name of arr_common_search_url_params)
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
    let res = true;
    const a = new URL(p_url_str);

    if(a.hostname.length < 1)
    {
        res = false;
    }
    else
    {
        // list of hostname patterns to not track
        const arr_blocklist = [
            'about:',
            'moz-extension:', //firefox extension pages
            'chrome:', //chrome pages
            'mail.', //hopefully captures all email websites?
            'accounts.google',
            'outlook.', //outlook Mail


            // 'docs.google.', //G-suite documents
            // 'drive.google.', //google
            // 'office.com', //Office365
            //TODO: others
        ];

        for(let d of arr_blocklist)
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



/** ____________________________ SYNCING metadata __________________________________
 * delete rows from localDB which are synced in remote db
 *
 * ------------------------------
 *    syncing localstorage keys
 * ------------------------------
 *  YASBIL_SYNC_STATUS:
 *   - ON = syncing;
 *   - OFF = not syncing
 *  YASBIL_SYNC_N_ROWS_TOT:
 *   - 0 .. n; no of rows (total) left in indexed db (i.e. not synced,
 *     since we're deleting local rows)
 *  YASBIL_SYNC_N_ROWS_DONE:
 *   - 0 .. n; no. of rows synced in the current sync job: for progress bar
 *  YASBIL_SYNC_MSG:
 *   - text message to display while syncing
 *
 * -----------------------------------------
 *   extension storage (too much hassle; using localstorage)
 * ----------------------------
 *  WP_URL
 *  WP_USERNAME
 *  WP_APP_PASSWORD
 *
 * ----------------------------------------------------------*/


//-------------------- get sync status: returns "OFF" if not syncing -----------------
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

function increment_sync_rows_tot(p_increment = 1) {
    let n_rows_tot = (parseInt(localStorage.getItem('YASBIL_SYNC_N_ROWS_TOT')) + p_increment);
    localStorage.setItem('YASBIL_SYNC_N_ROWS_TOT',  n_rows_tot.toString());
}

function get_sync_rows_done() {
    return parseInt(localStorage.getItem('YASBIL_SYNC_N_ROWS_DONE'));
}

function set_sync_rows_done(p_sync_rows_done) {
    localStorage.setItem('YASBIL_SYNC_N_ROWS_DONE',  p_sync_rows_done);
}

function increment_sync_rows_done(p_increment) {
    let n_rows = (parseInt(localStorage.getItem('YASBIL_SYNC_N_ROWS_DONE')) + p_increment);
    localStorage.setItem('YASBIL_SYNC_N_ROWS_DONE',  n_rows.toString());
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

//_________________________ end SYNCING related metadata ___________________________



// ----- sync settings options -------
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
    const basic_auth = btoa(settings.USER + ':' + settings.PASS);

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Basic " + basic_auth);

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };


    const req_url = settings.URL + API_NAMESPACE;

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
            throw new Error('Invalid Server URL.');


        if(json_resp.hasOwnProperty('code')) {
            if(json_resp.code === 'invalid_username' || json_resp.code === 'incorrect_password')
                throw new Error('Invalid username / password combination.');
        }

        // check is json response has property 'namespace'
        // whose value is equal to yasbil/v1
        if(!(
            json_resp.hasOwnProperty('namespace')
            && json_resp.namespace === REQ_NAMESPACE
        )){
            throw new Error('Invalid Server URL.');
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



//-------------------- update_sync_data_msg -----------------
async function update_sync_data_msg()
{

    //const obj_counts = {};
    let n_tot = 0;
    let sync_msg = //`<i>No data available to sync.</i>` +
        `<i> Turn on logging and browse the internet to record data.</i>`;
    let row_counts_html = "<p class='text-end' style='width: 80%'>";

    for (let i = 0; i < TABLES_TO_SYNC.length; i++)
    {
        const tbl = TABLES_TO_SYNC[i];

        const row_count = await db.table(tbl.name)
            .where('sync_ts').equals(0)
            .count();

        // console.log('sync_data_msg', tbl.name, row_count);

        n_tot += row_count;

        row_counts_html = row_counts_html +
            `${tbl.nice_name}: <b>${row_count}</b> rows <br/>`;
    }

    row_counts_html = row_counts_html +
        "---------------------------<br/>" +
        "Total: <b>" + n_tot + "</b> rows <br/>" +
        "---------------------------" +
        "</p>";

    set_sync_rows_tot(n_tot);

    if(n_tot > 0)
    {
        if(get_sync_status() === "OFF")
            sync_msg = `Data ready to sync:<br/><br/>${row_counts_html}`;
        else
            sync_msg = `Data being to synced:<br/><br/>${row_counts_html}`;
    }

    set_sync_data_msg(sync_msg);
}





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
    if(ms === 0)
        return "x";

    return new Date(ms)
        .toISOString()
        .replace('T', ' ');
}


// -------------- truncate string --------------------
function yasbil_truncate_str(long_str, thresh = 30)
{
    /*
    if (strlen($long_str) >= $thresh) {
        return substr($long_str, 0, $thresh-3). "..."; // . substr($long_str, -5);
    }
    else {
        return $long_str;
    }*/
}





// https://dmitripavlutin.com/javascript-fetch-async-await/
// https://javascript.info/promise-chaining#bigger-example-fetch
// https://javascript.info/async-await#await
// https://developers.google.com/web/fundamentals/primers/async-functions
// arrow functions
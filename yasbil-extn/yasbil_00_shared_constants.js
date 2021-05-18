/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-14
 * Time: 09:45 AM CDT
 *
 * All constants
 */



// database table names
const DEXIE_DB_TABLES = {
    yasbil_sessions: 'session_guid,sync_ts',
    yasbil_session_pagevisits: 'pv_guid,sync_ts',
    yasbil_session_mouse: 'm_guid,sync_ts',
    yasbil_session_webnav: 'webnav_guid,sync_ts',
    yasbil_session_serp_scrape: 'scrape_guid,sync_ts',
    //yasbil_session_pagetext: 'pt_guid,[session_guid+url],sync_ts',
    //yasbil_session_framevisits: 'fv_guid',
}

const ARR_TABLES_SYNC_INFO = [{
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
},
];

// name of search engine;
// hostname pattern;
// search query param name;
// SERP pg param name (offset)
const ARR_SEARCH_ENGINES = [
    { se_name: 'GOOGLE SCHOLAR', host: 'scholar.google.', qry: 'q',     pg: ''},
    { se_name: 'GOOGLE',    host: 'google.',    qry: 'q',   pg: 'start' },
    { se_name: 'YOUTUBE',   host: 'youtube.',   qry: 'search_query', pg: '' },
    { se_name: 'BING',      host: 'bing.',      qry: 'q',       pg: 'first' },
    { se_name: 'DUCKDUCKGO',host: 'duckduckgo.', qry: 'q',      pg: '' },
    { se_name: 'YAHOO',     host: 'yahoo.',     qry: 'p',       pg: '' },


    { se_name: 'AMAZON',    host: 'amazon.',    qry: 'k',       pg: '' },
    { se_name: 'WIKIPEDIA', host: 'wikipedia.', qry: 'search',  pg: '' },
    { se_name: 'EBAY',      host: 'ebay.',      qry: '_nkw',    pg: '' },

    // TODO: others? WebMD etc.? UT Library

    { se_name: 'BAIDU',     host: 'baidu.',     qry: 'wd',      pg: '' },
    { se_name: 'YANDEX',    host: 'yandex.',    qry: 'text',    pg: '' },

    { se_name: 'FLIPKART',  host: 'flipkart.',  qry: 'q',       pg: '' },
    { se_name: 'NAVER',     host: 'naver.',     qry: 'query',   pg: '' }, //south korea
    { se_name: 'SEZNAM',    host: 'seznam.',    qry: 'q',       pg: '' }, //Czech Republic
];

// "common" search url params
const ARR_COMMON_SEARCH_URL_PARAMS = [
    'q', 'query', 'k', 'search', 'search_query',
];

// list of hostname patterns to not track
const ARR_URL_BLOCKLIST = [
    'mail.', //captures all email websites (hopefully?)
    'accounts.google', // Google accounts
    'outlook.', //outlook Mail

    'volt.ischool.utexas.edu', //volt webpages
    'about:',
    'moz-extension:', //firefox extension pages
    'chrome:', //chrome pages

    // 'docs.google.', //G-suite documents
    // 'drive.google.', //google
    // 'office.com', //Office365
    //TODO: others
];

//------------ sync constants -------------
const API_NAMESPACE = `/wp-json/yasbil/v2_0_0`;
const CHECK_CONNECTION_ENDPOINT = '/check_connection';


//----- content script logging constants -------------
//log mouse move after x milliseconds (// NOTE: (Huang+, CHI'11)'s method not working)
// const MOVE_LOG_THRESH = 1000;

// log hover events only if greater than x milliseconds
const HOVER_DUR_THRESH = 100; // as low a number, more like mousemove; original: 500 1`0;
// const HOVER_LOG_THRESH = 1000;

// log scroll events only if amount scrolled is
// greater than x% of page width or page height
const SCROLL_Y_THRESH = 1;
const SCROLL_X_THRESH = 1;




























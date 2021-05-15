/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-14
 * Time: 09:45 AM CDT
 *
 * Util functions that do not depend on DB
 */

// database table names
export const DEXIE_DB_TABLES = {
    yasbil_sessions: 'session_guid,sync_ts',
    yasbil_session_pagevisits: 'pv_guid,sync_ts',
    yasbil_session_mouse: 'm_guid,sync_ts',
    yasbil_session_webnav: 'webnav_guid,sync_ts',
    yasbil_session_serp_scrape: 'scrape_guid,sync_ts',
    //yasbil_session_pagetext: 'pt_guid,[session_guid+url],sync_ts',
    //yasbil_session_framevisits: 'fv_guid',
}

export const ARR_TABLES_SYNC_INFO = [{
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

// name of search engine; hostname pattern; search query param name
export const ARR_SEARCH_ENGINES = [
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

// "common" search url params
export const ARR_COMMON_SEARCH_URL_PARAMS = [
    'q', 'query', 'k', 'search', 'search_query',
];

// list of hostname patterns to not track
export const ARR_URL_BLOCKLIST = [
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
export const API_NAMESPACE = `/wp-json/yasbil/v2_0_0`;
export const CHECK_CONNECTION_ENDPOINT = '/check_connection';
































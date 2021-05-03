/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-03
 * Time: 04:26 PM CDT
 */

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
    console.log('Database opened successfully');
}).catch (function (err) {
    console.log('DB Open Error occurred');
    console.log(err);
});
/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-14
 * Time: 09:45 AM CDT
 *
 * All functions that depend on DB (insert, sync, etc)
 * Should only import constants and utils
 *
 */
import Dexie from './dexie.mjs';
// import * as constant from './yasbil_00_constants.js';
// import * as util from './yasbil_00_utils.js';

const db = new Dexie("yasbil_db");
const _LARGE_STR_THRESH = 100;
let _DICT_ALL_STRINGS = {};

db.version(1).stores(DEXIE_DB_TABLES);

db.open().then(async function (db) {
    await __popl_string_dict();
    update_sync_data_msg();
    __del_synced_data(); // delete data synced over a week ago
    console.log('Database opened successfully');
}).catch (function (err) {
    console.log('DB Open Error occurred');
    console.log(err);
});

// no need to export db?
// export { db };

// generic function to insert row in table
export async function insert_row(table_name, data_row, upd_sync_msg=false)
{
    await db.table(table_name)
        .add(data_row)
        .catch(function(error) {
            console.log(`${table_name} insert error: ${error}`);
        });

    // update sync message to show on front end
    if(upd_sync_msg)
        update_sync_data_msg(); // no need to await
}




// generic function to select all rows from table as array
export async function select_all(table_name)
{
    return await db.table(table_name).toArray();
}


//-------------------- __popl_string_dict -----------------
// populate _DICT_ALL_STRINGS
async function __popl_string_dict()
{
    const arr_all_str = await select_all('yasbil_session_largestring');

    for(const row of arr_all_str)
    {
        _DICT_ALL_STRINGS[row['string_guid']] = row['string_body'];
    }

    console.log('string dict populated: ', Object.keys(_DICT_ALL_STRINGS).length);
}


//-------------------- string2hash -----------------

// string hash has a format `guid|start_index|end_index` where
// the string being sought is a substring of the `string_body`
// located at row with guid, from `start_index` to `end_index`;
export async function string2hash(p_largestring, is_html=false)
{
    try
    {
        // do not store in DB is string is less than 100 chars
        if(p_largestring.length <= _LARGE_STR_THRESH)
            return p_largestring;

        //if HTML, compress it
        let large_str = is_html ? compress_html_string(p_largestring) : p_largestring;
        const str_len = large_str.length;

        // if in-memory cache empty, repopulate it
        if(Object.keys(_DICT_ALL_STRINGS).length === 0)
            await __popl_string_dict();

        // loop over all existing strings
        for (const [string_guid, string_body] of Object.entries(_DICT_ALL_STRINGS))
        {
            if(string_body.indexOf(large_str) >= 0)
            {
                const start_idx = string_body.indexOf(large_str);
                const end_idx = start_idx + str_len;

                const str_hash = `${string_guid}|${start_idx}|${end_idx}`;

                // console.log('FOUND\t\t',str_hash);
                // string hash
                return str_hash;
            }
        }

        // no matches --> create new entry
        const string_guid = uuidv4();
        const data_row = {
            string_guid: string_guid,
            string_body: large_str,
            sync_ts: 0
        }

        // add to database
        insert_row('yasbil_session_largestring', data_row);

        // add to in-memory cache
        _DICT_ALL_STRINGS[string_guid] = large_str;

        const str_hash = `${string_guid}|0|${str_len}`;

        // console.log(str_hash);
        return str_hash;
    }
    catch (err)
    {
        console.error(err);
        return "";
    }
}




//-------------------- hash2string -----------------
export function hash2string(p_hash)
{
    try
    {
        const split_arr = p_hash.split('|');

        //string locator does not have 3 pipe-delmited parts
        // so must be original string
        if(split_arr.length !== 3)
            return p_hash;

        const string_guid = split_arr[0];
        const start_idx = parseInt(split_arr[1]);
        const end_idx = parseInt(split_arr[2]);

        if(_DICT_ALL_STRINGS[string_guid])
        {
            return _DICT_ALL_STRINGS[string_guid].substring(start_idx, end_idx);
        }

        return p_hash;

    }
    catch (err)
    {
        console.error(err);
        return "";
    }
}



// specific function to update sessions table
export async function end_session()
{
    await db.yasbil_sessions.update(
        get_session_guid(), {session_end_ts: new Date().getTime()}
    ).catch(function(error)
    {
        console.log("Session End DB Error: " + error);
    });
}

//-------------------- do_sync_job -----------------
export async function do_sync_job()
{
    // 1. check login credential; if invalid send to settings page
    // 2. upload data from tables one by one
    // 2.1   update progress message and row counts
    // 3 update tot row counts

    // sync result:
    // PROGRESS - show progress bar
    // SUCCESS - hide progressbar
    // ERROR - hide progress bar

    try
    {
        set_sync_status('ON');
        set_sync_result('PROGRESS');

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

        for (let i = 0; i < ARR_TABLES_SYNC_INFO.length; i++)
        {
            let tbl = ARR_TABLES_SYNC_INFO[i];

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
        update_sync_data_msg();
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
    }
}



//-------------------- sync_table_data (no need to export) -----------------
async function sync_table_data(table_name, pk, api_endpoint)
{
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

    const sync_result = {
        ok: true,
        // resp_body_json: null, // needed?
        num_rows_done: 0,
        msg:''
    };

    try
    {
        // --------- STEP 1: SELECTing table data ---------
        let table_data = await db.table(table_name)
            .where('sync_ts').equals(0)
            .toArray();

        if(!table_data || table_data.length === 0){
            // throw new Error(`No syncable data in table`);
            return sync_result;
        }

        //todo: check payload length for large table data
        //const size_bytes = new TextEncoder().encode(JSON.stringify(table_data)).length
        //const size_kb = size_bytes / 1024;


        /*if(table_data.length >= 10)
            table_data = [
                table_data[0],
                table_data[1],
                table_data[2],
                table_data[3],
                table_data[4],
                table_data[5],
                table_data[6],
                table_data[7],
                table_data[8],
                table_data[9],
            ];*/


        const num_rows_sent = table_data.length;

        // --------- STEP 2: setting up POST request ---------
        const settings = yasbil_get_settings();
        const basic_auth = btoa(settings.USER + ':' + settings.PASS);

        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Basic " + basic_auth);
        myHeaders.append("Content-Type", "application/json");

        let body_data = JSON.stringify({
            table_name: table_name,
            client_pk_col: pk,
            num_rows: num_rows_sent,
            data_rows: table_data
        });

        const req_options = {
            method: 'POST',
            headers: myHeaders,
            body: body_data,
            redirect: 'follow'
        };

        const req_url = settings.URL + API_NAMESPACE + api_endpoint;


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
            throw new Error(`Error syncing ${table_name}: Invalid JSON returned: ${txt_resp}`);

        sync_result.resp_body_json = json_resp;


        // --------- STEP 4: tallying response rows with request rows ---------
        if(!json_resp.hasOwnProperty('guids'))
            throw new Error(`Error syncing ${table_name}: No GUIDs returned: ${txt_resp}`);

        const num_rows_received = json_resp.guids.length;

        if(num_rows_sent !== num_rows_received)
            throw new Error(`Error syncing ${table_name}: Rows sent = ${num_rows_sent}; Rows received = ${num_rows_received}`);


        // --------- STEP 5: update table rows with received sync_ts ---------
        const upd_sync_ts = parseInt(json_resp.sync_ts);
        await db.table(table_name)
            .where(pk)
            .anyOf(json_resp.guids)
            //.where('sync_ts').equals(0)
            .modify({sync_ts: upd_sync_ts});

        sync_result.num_rows_done = num_rows_received;
    }
    catch (err)
    {
        console.log(err);
        sync_result.ok = false;
        sync_result.msg = err.toString();
    }

    return sync_result;
}



//-------------------- update_sync_data_msg (no need to export) -----------------
export async function update_sync_data_msg()
{
    let n_tot = 0;
    let size_tot = 0;
    let sync_msg = //`<i>No data available to sync.</i>` +
        `<i> Turn on logging and browse the internet to record data.</i>`;
    let row_counts_html = "<p class='text-end' style='width: 80%'>";

    for (let i = 0; i < ARR_TABLES_SYNC_INFO.length; i++)
    {
        const tbl = ARR_TABLES_SYNC_INFO[i];

        const arr_tbl = await db.table(tbl.name)
            .where('sync_ts')
            .equals(0)
            .toArray()
            //.count()
        ;

        const row_count = arr_tbl.length;
        const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;

        n_tot += row_count;
        size_tot += tbl_size;

        row_counts_html = row_counts_html +
            `${tbl.nice_name}: <b>${row_count}</b> rows (${get_file_size(tbl_size)}) 
            <br/>
            `;
    }

    row_counts_html = row_counts_html +
        "---------------------------<br/>" +
        `Total: <b> ${n_tot} </b> rows (${get_file_size(size_tot)}) <br/>` +
        "---------------------------" +
        "</p>";

    set_sync_rows_tot(n_tot);

    if(n_tot > 0)
    {
        if(get_sync_status() === "OFF")
            sync_msg = `Data ready to sync:<br/><br/>${row_counts_html}`;
        else
            sync_msg = `Data being synced:<br/><br/>${row_counts_html}`;
    }

    set_sync_data_msg(sync_msg);
}




// -------------------- reset_sync_ts --------------------
async function __reset_sync_ts()
{
    // in case of sync error: to be called manually
    // sets sync_ts = 0 in all tables
    // idea: can be synced to a backup WP server with plugin installed

    for (let i = 0; i < ARR_TABLES_SYNC_INFO.length; i++)
    {
        let tbl = ARR_TABLES_SYNC_INFO[i];

        let n_rows = await db.table(tbl.name)
            .where('sync_ts').notEqual(0)
            .modify({sync_ts: 0});

        console.log(`Resetting ${tbl.name}; Num rows = ${n_rows}`);
    }

    await update_sync_data_msg();
}


// -------------------- __del_synced_data --------------------
async function __del_synced_data()
{
    const __DAY_THRESH = 1; // 7 days...
    const DEL_THRESH = __DAY_THRESH * 24 * 60 * 60 * 1000 ; // ... in milliseonds
    const oneWeekAgo = Date.now() - DEL_THRESH;

    for (let i = 0; i < ARR_TABLES_SYNC_INFO.length; i++)
    {
        let tbl = ARR_TABLES_SYNC_INFO[i];

        //change str to int
        // db.table(tbl.name).toCollection().modify(row => {
        //     row.sync_ts = parseInt(row.sync_ts);
        // });

        const n_rows = await db.table(tbl.name)
            .where('sync_ts')
            // synct_ts = 0 are rows that haven't been synced
            // [100 ms from epoch] is safe choice
            .between(100, oneWeekAgo)
            .delete();

        if(n_rows > 0)
            console.log(`Deleted rows from ${tbl.name}; #rows = ${n_rows}`);
    }
}


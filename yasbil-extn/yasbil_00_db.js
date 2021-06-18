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
    console.error('DB Open Error occurred');
    console.error(err);
    console.trace(err)
});

// no need to export db?
// export { db };

// generic function to insert row in table
export async function insert_row(table_name, data_row, upd_sync_msg=false)
{
    try
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
    catch (err)
    {
        console.error(`------------- Error insert_row() in table ${table_name}`);
        console.error(err);
        console.error(err.stack);
    }

}




// generic function to select all rows from table as array
export async function select_all(table_name, only_unsynced = false)
{
    //mother try
    try
    {
        //return await db.table(table_name).toArray();

        let result_arr = [];

        //inner try-catch to deal with very large tables
        try
        {
            //only unsynced rows
            if(only_unsynced)
            {
                result_arr = await db.table(table_name)
                    .where('sync_ts').equals(0)
                    .toArray();
            }
            else
            {
                // all rows
                result_arr = await db.table(table_name)
                    .toArray();
            }

            return result_arr;
        }
        catch (inner_err)
        {
            //deal with very large tables here
            console.log(`[select_all]: probably very large table [${table_name}], unsynced = ${only_unsynced}`);
            console.log(inner_err);

            // first, delete already synced data for this table
            await __del_synced_data(table_name,true);

            //then, loop to see how much can be sent, and reduce
            let n_limit = 2000, n_decrement = 500;
            let is_error = false;

            do
            {
                try
                {
                    console.log(`[select_all] ${table_name}: trying with n_limit = ${n_limit}`);

                    if(only_unsynced)
                    {
                        result_arr = await db.table(table_name)
                            .where('sync_ts').equals(0)
                            .limit(n_limit)
                            .toArray();
                    }
                    else
                    {
                        result_arr = await db.table(table_name)
                            .limit(n_limit)
                            .toArray();
                    }

                    is_error = false;
                }
                catch (inner_loop_err)
                {
                    console.log(`[select_all] ${table_name}: Error occurs at n_limit = ${n_limit}`);
                    n_limit -= n_decrement;
                    is_error = true
                }
            } while(is_error && n_limit >= 0);


            console.log(`[select_all]: finally sending ${result_arr.length} rows`);

            return result_arr;
        }
    }
    catch (err)
    {
        console.error(`------------- [select_all]: Error for table ${table_name}`);
        console.error(err);
        console.error(err.stack);

        return [];
    }
}





//-------------------- __popl_string_dict -----------------
// populate _DICT_ALL_STRINGS
async function __popl_string_dict()
{
    try
    {
        const arr_all_str = await select_all('yasbil_largestring');

        for(const row of arr_all_str)
        {
            _DICT_ALL_STRINGS[row['string_guid']] = row['string_body'];
        }
    }
    catch (err)
    {
        console.error(`------------- Error __popl_string_dict()`);
        console.error(err);
        console.error(err.stack);
    }

}


//-------------------- string2hash -----------------

// string hash has a format `guid|start_index|end_index` where
// the string being sought is a substring of the `string_body`
// located at row with guid, from `start_index` to `end_index`;
export async function string2hash(p_largestring, src_url="", is_html=false)
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
            src_url: src_url,
            sync_ts: 0
        }

        // add to database
        insert_row('yasbil_largestring', data_row);

        // add to in-memory cache
        _DICT_ALL_STRINGS[string_guid] = large_str;

        const str_hash = `${string_guid}|0|${str_len}`;

        // console.log(str_hash);
        return str_hash;
    }
    catch (err)
    {
        console.error(`------------- Error string2hash()`);
        console.error(err);
        console.error(err.stack);
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
        console.error(`------------- Error hash2string()`);
        console.error(err);
        console.error(err.stack);
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
        console.error("------------- Session End DB Error: " + error);
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
                // increment_sync_rows_done(sync_result.num_rows_done);
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

        console.error(`------------- Error do_sync_job()`);
        console.error(err);
        console.error(err.stack);
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
        // max payload size to upload in one request (server query size),
        const PAYLOAD_MAX_SIZE_MB = 4;

        // loop exits when no more sync_ts = 0?
        while(true)
        {
            // --------- STEP 1: SELECTing unsynced table data ---------
            // let table_data = await db.table(table_name)
            //     .where('sync_ts').equals(0)
            //     .toArray();

            let table_data = await select_all(table_name, true);

            // loop exit condition?
            if(!table_data || table_data.length === 0){
                // throw new Error(`No syncable data in table`);
                return sync_result;
            }

            //todo: check payload length for large table data
            const size_bytes = new TextEncoder().encode(JSON.stringify(table_data)).length
            const size_mb = size_bytes / (1024 * 1024);

            if(size_mb >= PAYLOAD_MAX_SIZE_MB)
            {
                // if n rows create size_mb, how many rows for payload_max_size?
                const n_rows_to_send = Math.floor(table_data.length / size_mb * PAYLOAD_MAX_SIZE_MB);
                table_data = table_data.slice(0, n_rows_to_send);
            }

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

            sync_result.num_rows_done += num_rows_received;
        }
    }
    catch (err)
    {
        sync_result.ok = false;
        sync_result.msg = err.toString();

        console.error(`------------- Error sync_table_data()`);
        console.error(err);
        console.error(err.stack);
    }

    return sync_result;
}



//-------------------- update_sync_data_msg (no need to export) -----------------
export async function update_sync_data_msg()
{
    try
    {
        let n_tot = 0;
        let size_tot = 0;
        let sync_msg = //`<i>No data available to sync.</i>` +
            `<i> Turn on logging and browse the internet to record data.</i>`;

        let row_counts_html = `
        <small>
        <table class="table table-striped table-hover table-sm">
        <thead>
            <tr>
                <th class="text-start">Data Table</th>
                <th class="text-end"># Rows</th>
                <th class="text-end">Size</th>
            </tr>
        </thead>
        <tbody>
        `;

        for (let i = 0; i < ARR_TABLES_SYNC_INFO.length; i++)
        {
            const tbl = ARR_TABLES_SYNC_INFO[i];

            // const arr_tbl = await db.table(tbl.name)
            //         .where('sync_ts').equals(0)
            //         .toArray()
            // ;

            const arr_tbl = await select_all(tbl.name, true);

            const row_count = arr_tbl.length;
            const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;

            n_tot += row_count;
            size_tot += tbl_size;

            row_counts_html = row_counts_html +
                `<tr>
                <td class="text-start">${tbl.nice_name}</td>
                <td class="text-end">${row_count}</td>
                <td class="text-end">${get_file_size(tbl_size)}</td>
             </tr>
            `;
        }

        row_counts_html = row_counts_html +
            ` </tbody>
           <tfoot>
                <tr class="table-info fw-bold">
                    <td class="text-start">Total</td>
                    <td class="text-end">${n_tot}</td>
                    <td class="text-end">${get_file_size(size_tot)}</td>
                </tr>
            </tfoot>
        </table>
        </small>
        `;

        set_sync_rows_tot(n_tot);

        if(n_tot > 0)
        {
            if(get_sync_status() === "OFF")
                sync_msg = `Data Ready to Sync:<br/>${row_counts_html}`;
            else
                sync_msg = `Data Being Synced:<br/>${row_counts_html}`;
        }

        // console.log(sync_msg);

        set_sync_data_msg(sync_msg);
    }
    catch (err)
    {
        console.error(`------------- Error update_sync_data_msg()`);
        console.error(err);
        console.error(err.stack);
    }
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
async function __del_synced_data(table_name = "", force_delete = false)
{
    try
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

            let n_rows = 0;

            if(force_delete && table_name === tbl.name)
            {
                n_rows = await db.table(tbl.name)
                    .where('sync_ts')
                    // synct_ts = 0 are rows that haven't been synced
                    // [100 ms from epoch] is safe choice
                    .above(100)
                    .delete();
            }
            else
            {
                n_rows = await db.table(tbl.name)
                    .where('sync_ts')
                    // synct_ts = 0 are rows that haven't been synced
                    // [100 ms from epoch] is safe choice
                    .between(100, oneWeekAgo)
                    .delete();
            }


            if(n_rows > 0)
                console.log(`Deleted rows from ${tbl.name}; #rows = ${n_rows}`);
        }
    }
    catch (err)
    {
        console.error(`------------- Error __del_synced_data()`);
        console.error(err);
        console.error(err.stack);
    }

}


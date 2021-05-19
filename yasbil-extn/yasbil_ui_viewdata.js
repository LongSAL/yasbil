/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-03
 * Time: 10:23 AM CDT
 */

import * as db from './yasbil_00_db.js';

$(document).ready(async function()
{
    let TOTAL_DATA_SIZE = 0;

    // export all data as JSON
    // https://stackoverflow.com/a/52297652
    $('#export_json').click(async function ()
    {
        // since this operation takes time
        // hide the button for preventing multiple clicks
        $(this).hide();

        const json_export = {};
        for(let tbl of ARR_TABLES_SYNC_INFO)
        {
            const tbl_name = tbl.name;
            const tbl_data = await db.select_all(tbl_name);
            json_export[tbl_name] = tbl_data;
        }

        const ts = get_timestamp_for_filename();
        const filename = `yasbil_local_data_export_${ts}.json`;
        const jsonStr = JSON.stringify(json_export);

        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

        // after exporting done, show the button again
        $(this).show();
    });



    $('#yasbil_sessions').dataTable(
    {
        order: [[ 1, "desc" ]],
        ajax: async function (data, callback, settings)
        {
            const arr_tbl = await db.select_all('yasbil_sessions');

            const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;
            $('#size_yasbil_sessions').html(
                `(${get_file_size(tbl_size)})`
            );
            TOTAL_DATA_SIZE += tbl_size;

            // 'data' is the default property that DataTables looks for
            // in the source data object
            // https://datatables.net/manual/ajax

            const return_data = {
                'data': arr_tbl
            }
            // the second parameter (callback) should be called with a single parameter
            // passed in - the data to use to draw the table
            callback(return_data);
        },
        columns: [
            {//session id
                data: null, render: function (data, type, row) {
                    return row['session_guid'].substr(0, 6)+'...'
                }
            },

            {//start
                data: null, render: function (data, type, row) {
                    return yasbil_milli_to_str(row['session_start_ts'])
                }
            },

            {//end
                data: null, render: function (data, type, row) {
                    return yasbil_milli_to_str(row['session_end_ts'])
                }
            },

            {//platform
                data: null, render: function (data, type, row) {
                    return `
                        ${row['platform_os']||''}
                        ${row['platform_arch']||''}
                        ${row['platform_nacl_arch']||''}
                    `;
                }
            },

            {//Browser
                data: null, render: function (data, type, row) {
                    return `
                        ${row['browser_vendor']||''}
                        ${row['browser_name']||''}
                        ${row['browser_version']||''}
                    `;
                }
            },


            {//sync_ts
                data: null, render: function (data, type, row) {
                    return `
                        <small>
                        ${yasbil_milli_to_str(parseInt(row['sync_ts']))}
                        </small>
                    `;
                }
            },
        ]
    });



    $('#yasbil_session_pagevisits').dataTable(
    {
        order: [[ 1, "desc" ]],
        ajax: async function (data, callback, settings)
        {

            const arr_tbl = await db.select_all('yasbil_session_pagevisits');

            const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;
            $('#size_yasbil_session_pagevisits').html(
                `(${get_file_size(tbl_size)})`
            );
            TOTAL_DATA_SIZE += tbl_size;

            callback({
                'data': arr_tbl
            });

            //removing duplicate webNavigation event rows, using hist_ts value
            // const lookup = {};
            // const arr_unique = [];
            // for(let row of arr_all_data)
            // {
            //     const unq_key = `${row['session_guid']}_${row['hist_ts']}`;
            //
            //     if(!row['pv_event'].startsWith('webNavigation'))
            //     {
            //         arr_unique.push(row);
            //     }
            //     else if(!(unq_key in lookup))
            //     {
            //         lookup[unq_key] = 1;
            //         arr_unique.push(row);
            //     }
            // }
            //
            // callback({
            //     'data': arr_unique //arr_all_data
            // });
        },
        columns: [
            {//guid
                data: null, render: function (data, type, row) {
                    return row['session_guid'].substr(0, 6)+'...'
                }
            },
            {//time
                data: null, render: function (data, type, row) {
                    return yasbil_milli_to_str(row['pv_ts'])
                }
            },

            { // url and sizes
                data: null, render: function (data, type, row) {
                    return `
                    <small>
                    <a href='${row['pv_url']}' target='_blank'>
                        ${row['pv_hostname']}
                    </a>
                    <br/>
                    Text: ${(row['pv_page_text'].length/1000).toFixed(1)}k 
                    <br/>
                    HTML: ${(row['pv_page_html'].length/1000).toFixed(1)}k
                    </small>
                    `;
                }
            },

            { //event
                width: '15%',
                data: null, render: function (data, type, row) {
                    return ` 
                    <small>
                    ${row['pv_event'].replaceAll('.', ' ').replaceAll('_', ' ')}
                    </small>
                    `;
                }
            },

            { //page title
                data: null, render: function (data, type, row) {
                    return ` 
                    <small>
                    ${row['pv_title']}
                    
                    </small>
                    `;
                }
            },

            {// transition
                data: null, render: function (data, type, row) {
                    return ` 
                    <small>
                    ${row['pv_transition_type'].replaceAll('.', ' ').replaceAll('_', ' ')}
                    </small>
                    `;
                }
            },

            {//search engine: search query
                data: null, render: function (data, type, row) {
                    return `
                    ${row['pv_search_engine']}
                    <br/>
                    ${row['pv_search_query']}
                    `;
                }
            },

            {//sync_ts
                data: null, render: function (data, type, row) {
                    return `
                        <small>
                        ${yasbil_milli_to_str(parseInt(row['sync_ts']))}
                        </small>
                    `;
                }
            },
        ]
    });



    $('#yasbil_session_mouse').dataTable(
        {
            order: [[ 1, "desc" ]],
            ajax: async function (data, callback, settings)
            {
                const arr_tbl = await db.select_all('yasbil_session_mouse');

                const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;
                $('#size_yasbil_session_mouse').html(
                    `(${get_file_size(tbl_size)})`
                );
                TOTAL_DATA_SIZE += tbl_size;

                callback({
                    'data': arr_tbl
                });
            },
            columns: [
                {//session id
                    data: null, render: function (data, type, row) {
                        return row['session_guid'].substr(0, 6)+'...'
                    }
                },
                {//ts
                    data: null, render: function (data, type, row) {
                        return yasbil_milli_to_str(row['m_ts'])
                    }
                },
                {//url
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        <a href='${row['m_url']}' target='_blank'>
                            ${new URL(row['m_url']).hostname}
                        </a>
                        </small>
                        `;
                    }
                },

                {//event
                    data: null, render: function (data, type, row) {
                        return `
                        ${row['m_event'].replace('MOUSE_', '')} 
                        <br/>
                        ${(row['hover_dur']/1000).toFixed(1)} s
                        `;
                    }
                },



                {
                    width: '15%',
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        Page: ${row['page_w']} x ${row['page_h']}
                        <br/>
                        Browser: ${row['browser_w']} x ${row['browser_h']}
                        
                        <br/>
                        Viewport: ${row['viewport_w']} x ${row['viewport_h']}
                        </small>
                        `;
                    }
                },

                {
                    width: '20%',
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        Pointer: 
                        ${row['mouse_x']} 
                        (${(row['mouse_x']/row['page_w']*100).toFixed(0)}%), 
                        ${row['mouse_y']}
                        (${(row['mouse_y']/row['page_h']*100).toFixed(0)}%)
                        <br/>
                        Scrolled: ${row['page_scrolled_y']}
                        (${(row['page_scrolled_y']/row['page_h']*100).toFixed(0)}%)
                        to
                        ${row['page_scrolled_y']+row['viewport_h']}
                        (${((row['page_scrolled_y']+row['viewport_h'])/row['page_h']*100).toFixed(0)}%)
                        </small>
                        `;
                    }
                },

                {
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        ${row['target_text'].substr(0, 70)}...
                        </small>
                        `;
                    }
                },

                {//sync_ts
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        ${yasbil_milli_to_str(parseInt(row['sync_ts']))}
                        </small>
                    `;
                    }
                },
            ]
        });


    $('#yasbil_session_serp').dataTable(
        {
            order: [[ 1, "desc" ]],
            ajax: async function (data, callback, settings)
            {
                const arr_tbl = await db.select_all('yasbil_session_serp');

                const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;
                $('#size_yasbil_session_serp').html(
                    `(${get_file_size(tbl_size)})`
                );
                TOTAL_DATA_SIZE += tbl_size;

                callback({
                    'data': arr_tbl
                });
            },
            columns: [
                {//session id
                    data: null, render: function (data, type, row) {
                        return row['session_guid'].substr(0, 6)+'...'
                    }
                },
                {//time
                    data: null, render: function (data, type, row) {
                        return yasbil_milli_to_str(row['serp_ts'])
                    }
                },
                {//url
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        <a href='${row['serp_url']}' target='_blank'>
                            ${new URL(row['serp_url']).hostname.substr(0, 30)}
                        </a>
                        </small>
                        `;
                    }
                },

                {//Search Engine, Search Query
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        ${row['search_engine']}
                        ${row['serp_offset'] > 0 ? " 2nd page" : ""}:
                        ${row['search_query']}
                        <br/>
                        Length: ${row['scraped_json_arr'].length}
                        </small>
                        `;
                    }
                },

                {//SERP Data
                    data: null, render: function (data, type, row) {

                        let return_data = "";
                        const json_arr = row['scraped_json_arr'];

                        let i = 0;
                        for(let arr_i of json_arr)
                        {
                            if(arr_i.type === 'DOCUMENT')
                                continue;

                            return_data = return_data +
                                `${arr_i.type}:
                                 ${arr_i.inner_text.substring(0, 20)} 
                                <br/>`;

                            i++;
                            if(i >= 3)
                                break;
                        }

                        //return_data += `Length: ${json_arr.length}`;

                        return `
                        <small>${return_data}</small>
                        `
                        ;
                    }
                },


                {//sync_ts
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        ${yasbil_milli_to_str(parseInt(row['sync_ts']))}
                        </small>
                    `;
                    }
                },
            ]
        });


    $('#yasbil_session_webnav').dataTable(
        {
            order: [[ 1, "desc" ]],
            ajax: async function (data, callback, settings)
            {
                const arr_tbl = await db.select_all('yasbil_session_webnav');

                const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;
                $('#size_yasbil_session_webnav').html(
                    `(${get_file_size(tbl_size)})`
                );
                TOTAL_DATA_SIZE += tbl_size;

                callback({
                    'data': arr_tbl
                });
            },
            columns: [
                {//session id
                    data: null, render: function (data, type, row) {
                        return row['session_guid'].substr(0, 6)+'...'
                    }
                },
                {//time
                    data: null, render: function (data, type, row) {
                        return yasbil_milli_to_str(row['webnav_ts'])
                    }
                },
                {//url
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        <a href='${row['webnav_url']}' target='_blank'>
                            ${new URL(row['webnav_url']).hostname.substr(0, 30)}
                        </a>
                        </small>
                        `;
                    }
                },

                {//event
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        ${row['webnav_event'].replace('.', ' ')}
                        </small>
                        `;
                    }
                },

                {//transition
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        ${row['webnav_transition_type']}
                        <br/>
                        ${row['webnav_transition_qual']}
                        </small>
                        `;
                    }
                },


                {//sync_ts
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        ${yasbil_milli_to_str(parseInt(row['sync_ts']))}
                        </small>
                    `;
                    }
                },
            ]
        });


    //await 2 seconds (hopefully table loads fully)
    await sleep(1000);

    $('#size_total').html(
        `Approx Size: ${get_file_size(TOTAL_DATA_SIZE)}`
    );


}); // -- document.ready end ---
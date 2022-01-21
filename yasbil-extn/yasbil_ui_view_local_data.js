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
        try
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
            const filename_prefix = `yasbil_data_${ts}`;
            const json_filename = filename_prefix + '.json';
            const json_string = JSON.stringify(json_export);

            /*const zip_filename = filename_prefix + '.zip';
            console.log('zip start');
            //------ zipping ----------
            //https://github.com/photopea/UZIP.js
            //https://github.com/101arrowz/fflate
            const buf = fflate.strToU8(json_string);
            const zip_Uint8Array = fflate.zipSync(buf, { level: 9 }); //returns Uint8Array
            const zip_base64 = btoa(new TextDecoder().decode(zip_Uint8Array));
            console.log('zip end');*/



            let element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json_string));
            element.setAttribute('download', json_filename);

            // element.setAttribute('href', 'data:text/plain;base64,' + encodeURIComponent(zip_base64));
            // element.setAttribute('download', zip_filename);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);

            // after exporting done, show the button again
            $(this).show();
        }
        catch (err)
        {
            console.error(err);
        }
    });



    $('#yasbil_sessions').dataTable(
    {
        order: [[ 1, "desc" ]],
        ajax: async function (data, callback, settings)
        {
            const arr_tbl = await db.select_all('yasbil_sessions');

            const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;
            $('#size_yasbil_sessions').html(
                `(${arr_tbl.length} rows; ${get_file_size(tbl_size)})`
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


    //await few seconds to load in-memory string cache
    await sleep(1000);

    $('#yasbil_session_pagevisits').dataTable(
    {
        order: [[ 1, "desc" ]],
        ajax: async function (data, callback, settings)
        {

            const arr_tbl = await db.select_all('yasbil_session_pagevisits');

            const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;
            $('#size_yasbil_session_pagevisits').html(
                `(${arr_tbl.length} rows; ${get_file_size(tbl_size)})`
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

                    const pv_page_text = db.hash2string(row['pv_page_text']);
                    const pv_page_html = db.hash2string(row['pv_page_html']);

                    return `
                    <small>
                    <a href='${row['pv_url']}' target='_blank'>
                        ${row['pv_hostname']}
                    </a>
                    <br/>
                    Text: ${(pv_page_text.length/1000).toFixed(1)}k 
                    <br/>
                    HTML: ${(pv_page_html.length/1000).toFixed(1)}k
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
                    `(${arr_tbl.length} rows; ${get_file_size(tbl_size)})`
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



                {// dimensions
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

                {// locations
                    width: '20%',
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        Mouse: 
                        ${row['mouse_x']} 
                        (${(row['mouse_x']/row['page_w']*100).toFixed(0)}%), 
                        ${row['mouse_y']}
                        (${(row['mouse_y']/row['page_h']*100).toFixed(0)}%)
                        <br/>
                        Viewport: ${row['page_scrolled_y']}
                        (${(row['page_scrolled_y']/row['page_h']*100).toFixed(0)}%)
                        to
                        ${row['page_scrolled_y']+row['viewport_h']}
                        (${((row['page_scrolled_y']+row['viewport_h'])/row['page_h']*100).toFixed(0)}%)
                        </small>
                        `;
                    }
                },

                {// event tagret
                    data: null, render: function (data, type, row) {

                        const target_text = db.hash2string(row['target_text']);
                        const target_html = db.hash2string(row['target_html']);

                        return `
                        <small>
                        ${target_text.substr(0, 50)}
                        
                        <br/>
                        Text: ${(target_text.length/1000).toFixed(1)}k 
                        |
                        HTML: ${(target_html.length/1000).toFixed(1)}k
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
                    `(${arr_tbl.length} rows; ${get_file_size(tbl_size)})`
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
                        const json_arr = JSON.parse(row['scraped_json_arr']);

                        let i = 0;
                        for(let arr_i of json_arr)
                        {
                            if(arr_i.type === 'DOCUMENT')
                                continue;

                            const inner_text = db.hash2string(arr_i.inner_text);

                            return_data = return_data +
                                `${arr_i.type}:
                                 ${inner_text.substring(0, 20)} 
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
                    `(${arr_tbl.length} rows; ${get_file_size(tbl_size)})`
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
                {//tab id
                    data: null, render: function (data, type, row) {
                        return row['tab_id'] + '<br/>' + row['tab_guid'].substr(0, 6)+'...'
                    }
                },
                {//url
                    data: null, render: function (data, type, row) {
                        if(row['webnav_url']){
                            return `
                            <small>
                            <a href='${row['webnav_url']}' target='_blank'>
                                ${new URL(row['webnav_url']).hostname.substr(0, 30)}
                            </a>
                            </small>
                            `;
                        }
                        else {
                            return ``;
                        }
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





    $('#yasbil_largestring').dataTable(
        {
            order: [[ 3, "desc" ]],
            ajax: async function (data, callback, settings)
            {
                const arr_tbl = await db.select_all('yasbil_largestring');

                const tbl_size = new TextEncoder().encode(JSON.stringify(arr_tbl)).length;
                $('#size_yasbil_largestring').html(
                    `(${arr_tbl.length} rows; ${get_file_size(tbl_size)})`
                );
                TOTAL_DATA_SIZE += tbl_size;

                callback({
                    'data': arr_tbl
                });
            },
            columns: [
                {//String id
                    data: null, render: function (data, type, row) {
                        return row['string_guid'].substr(0, 6)+'...'
                    }
                },
                {//url
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        <a href='${row['src_url']}' target='_blank'>
                            ${new URL(row['src_url']).hostname.substr(0, 30)}
                        </a>
                        </small>
                        `;
                    }
                },
                {//String Body
                    data: null, render: function (data, type, row) {

                        const str_body = row['string_body'].substring(0, 150);
                        const str_safe = html_encode(str_body) + '...';
                        return `<small>${str_safe}</small>`;
                    }
                },

                {//String Size
                    className: "text-end",
                    data: null, render: function (data, type, row) {
                        return (row['string_body'].length/1000).toFixed(1);
                    }
                },

                /*{//Full String Body (slows down some participants' machines)
                    data: null, render: function (data, type, row) {

                        const str_safe = html_encode(row['string_body']);
                        return `
                            <button class="btn btn-outline-secondary  btn-sm" 
                                data-bs-toggle="modal" 
                                data-bs-target="#modal_longtext"
                                data-longtext="${str_safe}" 
                                type="button">
                                View Full String   
                            </button>
                        `;

                    }
                },*/

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


    /*$("#modal_longtext").on('show.bs.modal', function (e)
    {
        const triggerLink = $(e.relatedTarget);
        const longtext = triggerLink.data('longtext');
        $(this).find(".modal-body #longtext_body").text(longtext);
    });*/


    //await 2 seconds (hopefully table loads fully)
    await sleep(1000);

    $('#size_total').html(
        `Approx Size: ${get_file_size(TOTAL_DATA_SIZE)}`
    );


}); // -- document.ready end ---

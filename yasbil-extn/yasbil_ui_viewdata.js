/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-03
 * Time: 10:23 AM CDT
 */

import * as db from './yasbil_00_db.js';

$(document).ready(function()
{
    $('#yasbil_sessions').dataTable(
    {
        order: [[ 1, "desc" ]],
        ajax: async function (data, callback, settings)
        {
            const arr_tbl = await db.select_all('yasbil_sessions');

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

            const arr_all_data = await db.select_all('yasbil_session_pagevisits');

            callback({
                'data': arr_all_data
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
                callback({
                    'data': await db.select_all('yasbil_session_mouse')
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




    $('#yasbil_session_webnav').dataTable(
        {
            order: [[ 1, "desc" ]],
            ajax: async function (data, callback, settings)
            {
                callback({
                    'data': await db.select_all('yasbil_session_webnav')
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

}); // -- document.ready end ---
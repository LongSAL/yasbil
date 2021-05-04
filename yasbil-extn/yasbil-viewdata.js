/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-03
 * Time: 10:23 AM CDT
 * //"dexie-3.0.3.js",
 */

$(document).ready(function()
{

    $('#yasbil_sessions').dataTable(
    {
        order: [[ 1, "desc" ]],
        ajax: async function (data, callback, settings)
        {
            const arr_tbl = await db.table('yasbil_sessions')
                //.where('sync_ts').equals(0)
                .toArray();

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
            {
                data: null, render: function (data, type, row) {
                    return row['session_guid'].substr(0, 6)+'...'
                }
            },

            {
                data: null, render: function (data, type, row) {
                    return yasbil_milli_to_str(row['session_start_ts'])
                }
            },

            {
                data: null, render: function (data, type, row) {
                    return yasbil_milli_to_str(row['session_end_ts'])
                }
            },

            {
                data: null, render: function (data, type, row) {
                    return `
                        ${row['platform_os']||''}
                        ${row['platform_arch']||''}
                        ${row['platform_nacl_arch']||''}
                    `;
                }
            },

            {
                data: null, render: function (data, type, row) {
                    return `
                        ${row['browser_vendor']||''}
                        ${row['browser_name']||''}
                        ${row['browser_version']||''}
                    `;
                }
            },


            {
                data: null, render: function (data, type, row) {
                    return yasbil_milli_to_str(row['sync_ts'])
                }
            },
        ]
    });



    $('#yasbil_session_pagevisits').dataTable(
    {
        order: [[ 1, "desc" ]],
        ajax: async function (data, callback, settings)
        {
            callback({
                'data': await db.table('yasbil_session_pagevisits')
                    .toArray()
            });
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

            { // url
                data: null, render: function (data, type, row) {
                    return `
                    <small>
                    <a href='${row['pv_url']}' target='_blank'>
                        ${row['pv_hostname']}
                    </a>
                    </small>
                    `;
                }
            },

            { //event
                width: '15%',
                data: null, render: function (data, type, row) {
                    return ` 
                    <small>
                    ${row['pv_event'].replace('.', ' ')}
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

            {data: 'pv_transition_type'},

            {//search engine: search query
                data: null, render: function (data, type, row) {
                    return `
                    ${row['pv_srch_engine']}
                    <br/>
                    ${row['pv_srch_qry']}
                `;
                }
            },

            {//synced
                data: null, render: function (data, type, row) {
                    return yasbil_milli_to_str(row['sync_ts'])
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
                    'data': await db.table('yasbil_session_mouse')
                        .toArray()
                });
            },
            columns: [
                {
                    data: null, render: function (data, type, row) {
                        return row['session_guid'].substr(0, 6)+'...'
                    }
                },
                {
                    data: null, render: function (data, type, row) {
                        return yasbil_milli_to_str(row['m_ts'])
                    }
                },
                {
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
                        Viewport: ${row['viewport_w']} x ${row['viewport_w']}
                        <br style="margin-top: 15px"/>
                        Viewport %: 
                        ${(row['viewport_w']/row['page_w']*100).toFixed(0)} x 
                        ${(row['viewport_h']/row['page_h']*100).toFixed(0)}
                        </small>
                        `;
                    }
                },

                {
                    width: '15%',
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        Pointer: ${row['mouse_x']}, ${row['mouse_y']}
                        <br/>
                        Pointer %:
                        ${(row['mouse_x']/row['page_w']*100).toFixed(0)},  
                        ${(row['mouse_y']/row['page_h']*100).toFixed(0)}
                        
                        <br/>
                        Scrolled: ${row['page_x']}, ${row['page_y']}
                        <br style="margin-top: 15px"/>
                        Scrolled %:
                        ${(row['page_x']/row['page_w']*100).toFixed(0)},  
                        ${(row['page_y']/row['page_h']*100).toFixed(0)}
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

                {
                    data: null, render: function (data, type, row) {
                        return yasbil_milli_to_str(row['sync_ts'])
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
                    'data': await db.table('yasbil_session_webnav')
                        .toArray()
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

                // {//frame id
                //     data: null, render: function (data, type, row) {
                //         return `
                //         ${row['frame_id'] > 0 ? 'IFRAME' : 0}
                //         `;
                //     }
                // },



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


                {//sync ts
                    data: null, render: function (data, type, row) {
                        return yasbil_milli_to_str(row['sync_ts'])
                    }
                },
            ]
        });

}); // -- document.ready end ---
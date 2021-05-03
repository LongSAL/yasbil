/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-05-03
 * Time: 10:23 AM CDT
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
            {
                data: null, render: function (data, type, row) {
                    return row['session_guid'].substr(0, 6)+'...'
                }
            },
            {
                data: null, render: function (data, type, row) {
                    return yasbil_milli_to_str(row['pv_ts'])
                }
            },

            {
                data: null, render: function (data, type, row) {
                    return ` 
                    <small>
                    ${row['pv_event'].replace('.', ' ')}
                    </small>
                    `;
                }
            },

            {
                data: null, render: function (data, type, row) {
                    return `
                    <a href='${row['pv_url']}' target='_blank'>
                        ${row['pv_title']}
                    </a>
                    `;
                }
            },

            {data: 'pv_transition_type'},

            {
                data: null, render: function (data, type, row) {
                    return `
                    ${row['pv_srch_engine']}:
                    ${row['pv_srch_qry']}
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

                {
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
                        Viewport: ${row['viewport_w']} x ${row['viewport_w']}
                        <br/>
                        Browser: ${row['browser_w']} x ${row['browser_h']}
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
                        Scrolled: ${row['page_x']}, ${row['page_y']}
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
                {
                    data: null, render: function (data, type, row) {
                        return row['session_guid'].substr(0, 6)+'...'
                    }
                },
                {
                    data: null, render: function (data, type, row) {
                        return yasbil_milli_to_str(row['webnav_ts'])
                    }
                },
                {
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

                {
                    data: null, render: function (data, type, row) {
                        return `
                        <small>
                        ${row['webnav_event'].replace('.', ' ')}
                        </small>
                        `;
                    }
                },

                {
                    data: null, render: function (data, type, row) {
                        return `
                        ${row['frame_id'] > 0 ? 'IFRAME' : 0}
                        `;
                    }
                },



                {
                    //width: '15%',
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


                {
                    data: null, render: function (data, type, row) {
                        return yasbil_milli_to_str(row['sync_ts'])
                    }
                },
            ]
        });

}); // -- document.ready end ---
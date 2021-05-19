/**
 * Original Author: Nilavra Bhattacharya
 * Author URL: https://nilavra.in
 * Date: 2021-04-19
 * Time: 01:52 PM CDT
 *
 * This script runs on all pages visited by the user
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/executeScript
 *
 * jQuery to JS
 * http://youmightnotneedjquery.com/
 *
 */

/**
 * ------ EVENTS LIST ---------
 * UI Events: https://www.w3schools.com/jsref/obj_uievent.asp
 *
 * MOUSE: https://www.w3schools.com/jsref/obj_mouseevent.asp
 * onmousemove: occurs every time the mouse pointer is moved over the element
 * mouseenter: only occurs when the mouse pointer enters the element
 * onmouseover: event occurs when the mouse pointer enters the element, and its child elements
 *
 * SCROLL:
 * WHEEL: https://www.w3schools.com/jsref/obj_wheelevent.asp
 *
 */

function main() { try
{
    if(!is_tracking_allowed(window.location.href))
        return;

    // for debouncing very rapidly firing events
    // using whatever keys as desired
    const PREV_LOG = {
        'ts_hover': new Date().getTime(),
        'ts_move': new Date().getTime(),
        'mouse_x': -1,
        'mouse_y': -1,
        'scroll_x': 0,
        'scroll_y': 0,
        'scrape_arr': null,
    }

    //------- start script --------
    const p_BG_interaction = browser.runtime.connect({name:"port-ba-popup-to-bg"});

    scrape_serp(); //scrape serp on page load

    // -------------------- MOUSE event listeners --------------------


    // ----------- hover duration: mouseneter + mouseleave -----------
    // https://stackoverflow.com/a/5974898
    document.addEventListener('mouseover', function(e) {
        //record mouseenter time in data-attribute
        e.target.dataset.yasbil_hover_st = new Date().getTime();
    });

    document.addEventListener('mouseout', function(e) {
        const hover_end = new Date().getTime(); //mouseleave time
        //calculate the difference in ms
        const hover_dur = ( hover_end - e.target.dataset.yasbil_hover_st );
        if(hover_dur >= HOVER_DUR_THRESH){
            cs_log_mouse_and_scroll('MOUSE_HOVER', e, e.target.closest('a'), hover_dur);
        }
    });

    // ----------- left click -----------
    document.addEventListener('click', async function(e) {
        cs_log_mouse_and_scroll('MOUSE_CLICK', e, e.target.closest('a'));

        // rescrape SERP after waiting 1 sec
        // assuming: SERP is updated with clicks
        scrape_serp(1000);
    });

    // ----------- right click -----------
    document.addEventListener('contextmenu', function(e) {
        cs_log_mouse_and_scroll('MOUSE_RCLICK', e, e.target.closest('a'));

        // rescrape SERP after waiting 1 sec
        // assuming: SERP is updated with clicks
        scrape_serp(1000);
    });

    // ----------- double click -----------
    document.addEventListener('dblclick', function(e) {
        cs_log_mouse_and_scroll('MOUSE_DBLCLICK', e, e.target.closest('a'));
    });

    // --------- dom changes ----------------
    // https://stackoverflow.com/a/45117612
    // const dom_observer = new MutationObserver(function(mutation)
    // {
    //     // MutationRecord
    //     //console.log(mutation);
    //     // https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord
    //     console.log('mutation');
    //     scrape_serp();
    // });
    // const m_container = document.querySelector('#search'); //document.documentElement || document.body;
    // const m_config = {
    //     childList:true,
    //     subtree:true,
    //     //attributes: true,
    //     characterData: true
    // };
    // dom_observer.observe(m_container, m_config);




    // -------------------- SCROLL handler --------------------
    window.addEventListener('scroll', function (e)
    {
        // debouncing: scroll event fires many times rapidly
        // so log scroll events only if amount scrolled is
        // greater than x% of page width or page height

        const viewport = get_viewport_properties();

        const scroll_x_delta = viewport.page_scrolled_x - PREV_LOG['scroll_x'];
        const scroll_y_delta = viewport.page_scrolled_y - PREV_LOG['scroll_y'];
        // percentage of page width scrolled
        const pct_scroll_x = 100 * Math.abs(scroll_x_delta) / viewport.page_w;
        // percentage of page height scrolled
        const pct_scroll_y = 100 * Math.abs(scroll_y_delta) / viewport.page_h;

        if(pct_scroll_x >= SCROLL_X_THRESH || pct_scroll_y >= SCROLL_Y_THRESH)
        {
            // console.log('x: ', pct_scroll_x, 'y: ', pct_scroll_y);
            cs_log_mouse_and_scroll(
                'SCROLL', e,
                undefined, undefined,
                scroll_x_delta, scroll_y_delta
            );
            PREV_LOG['scroll_x'] = viewport.page_scrolled_x;
            PREV_LOG['scroll_y'] = viewport.page_scrolled_y;
        }

    })

    //TODO: select text, clipboard events






    // -------------------- MOUSE and SCROLL handler --------------------
    // single function to log all mouse interaction events from content script (cs)
    function cs_log_mouse_and_scroll(
        e_name,
        e, //event; NOT element
        closest_a = null,
        hover_dur= 0,
        scroll_x_delta= 0,
        scroll_y_delta= 0,
    )
    {
        //log mouse move only after THRESH time interval
        // if(e_name === 'MOUSE_MOVE' && (new Date().getTime() - prev_move_log_ts) < MOVE_LOG_THRESH)
        //     return;

        let sendMsg = true;

        // getting dom_branch to parent
        // https://stackoverflow.com/a/8729274
        let dom_path_arr = [];
        let target_text = '', target_html = '',
            target_width = 0, target_height = 0
        ;

        if(e.target && e.target.innerText) //possibly not true for SCROLL
        {
            target_text = e.target.innerText+'';
            target_html = compress_html_string(e.target.innerHTML+'');

            const bb_rect = e.target.getBoundingClientRect();
            target_width = bb_rect.width;
            target_height = bb_rect.height;

            let el = e.target;
            while (el) {
                dom_path_arr.push(el.tagName.toUpperCase());
                if(!el.parentElement)
                    break
                el = el.parentElement;
            }

            //console.log(target_text);
            // console.log(dom_path_arr.join('|'));
        }

        // constant data for all mouse interaction events
        const msg_obj = {
            yasbil_msg: "LOG_MOUSE_AND_SCROLL",
            yasbil_ev_data: {
                e_name: e_name,
                e_ts: new Date().getTime(),
                //page_url: window.location.href, //obtained by tabInfo

                //getting viewport properties (using ES6 spread notation)
                // https://stackoverflow.com/a/36044262
                ...get_viewport_properties(),

                //path from current element upto <HTML> in DOM
                //if there is 'A' in dom_path, event was over an anchor tag
                dom_path: dom_path_arr.join('|'),

                target_text: target_text, //rendered text of the target element
                target_html: target_html, //html of the target element
                target_width: target_width,
                target_height: target_height,

                //only if closest a found
                closest_a_text: '',
                closest_a_html: '',
                closest_a_width: 0,
                closest_a_height: 0,

                //for hover and click events
                mouse_x: -1,
                mouse_y: -1,

                // for hover event (mouseout - mousein)
                hover_dur: hover_dur,

                //for scroll events
                scroll_x_delta: scroll_x_delta,
                scroll_y_delta: scroll_y_delta,

            }
        };

        if(closest_a)
        {
            msg_obj.yasbil_ev_data.closest_a_text = closest_a.innerText;
            msg_obj.yasbil_ev_data.closest_a_html = closest_a.innerHTML;

            const a_bb_rect = closest_a.getBoundingClientRect();
            msg_obj.yasbil_ev_data.closest_a_width = a_bb_rect.width;
            msg_obj.yasbil_ev_data.closest_a_height = a_bb_rect.height;

        }

        if(e_name === 'MOUSE_MOVE')
        {
            //X-Y location of the mouse pointer
            msg_obj.yasbil_ev_data.mouse_x = e.pageX;
            msg_obj.yasbil_ev_data.mouse_y = e.pageY;
        }
        else if([
            'MOUSE_HOVER',
            'MOUSE_CLICK',
            'MOUSE_RCLICK',
            'MOUSE_DBLCLICK',
        ].includes(e_name))
        {
            //X-Y location of the mouse pointer
            msg_obj.yasbil_ev_data.mouse_x = e.pageX;
            msg_obj.yasbil_ev_data.mouse_y = e.pageY;
        }

        if(sendMsg){
            p_BG_interaction.postMessage(msg_obj);
        }

        // console.log(msg_obj);
        // console.log('CS:', e_name)//, new Date().getTime());
    }


    // ----------------------- scrape SERPS --------------------
    async function scrape_serp(sleep_ms=0)
    {
        const se_info = get_search_engine_info(window.location.href);

        if(!se_info.search_engine)
            return;

        // debounce
        if(sleep_ms > 0)
            await sleep(sleep_ms);

        // let sendMsg = true;

        let scrape_arr = [];

        switch (se_info.search_engine)
        {
            case "GOOGLE":
                scrape_arr = scrape_google_serp();
                break;
            case "BING":
                break;

        }

        if(scrape_arr.length < 1)
            return;

        // debouncing
        if(
            !PREV_LOG.scrape_arr //first time
            ||
            // SERP has loaded new content
            !object_equals(scrape_arr, PREV_LOG.scrape_arr)
            //scrape_arr.length !== PREV_LOG.scrape_arr.length
            //JSON.stringify(scrape_arr) !== JSON.stringify(PREV_LOG.scrape_arr)
        )
        {
            const msg_obj = {
                yasbil_msg: "LOG_SERP",
                yasbil_serp_data: {
                    serp_ts: new Date().getTime(),
                    serp_url: window.location.href,
                    search_engine: se_info.search_engine,
                    search_query: se_info.search_query,
                    serp_offset: se_info.serp_offset,

                    scraped_json_arr: scrape_arr,

                    ...get_viewport_properties(),
                }
            }

            PREV_LOG.scrape_arr = scrape_arr;

            //send message
            p_BG_interaction.postMessage(msg_obj);
            //console.log(msg_obj);
        }
    }



    // ---------- scrape Google SERP (haha!) ------------
    function scrape_google_serp()
    {
        // https://scraperbox.com/blog/how-to-scrape-google-search-results-with-python

        //array of objects to store the boxes/ client rects in the serp
        // box / rect can be of the following types
        // - 'DOCUMENT' --> to get page details
        // - 'MAIN_RESULT'
        // - 'NESTED_RESULT'
        // - 'RELATED_SEARCH'
        // - 'PEOPLE_ASK_CLOSED'
        // - 'PEOPLE_ASK_OPEN'
        // - 'PEOPLE_ALSO_SEARCH'
        // - 'OTHER'
        // order by page_y, page_x to sort of "recreate page
        // to get parent / child of nested elements:
        // - parent x1 <= child x1, child x2 <= parent x2
        // - parent y1 <= child y1, child y2 <= parent y2
        const serp_elements = [
            {
                type: 'DOCUMENT',
                //dont dump innerhtml for entire document repeatedly
                // already available in pagevisits (somewhat)
                // saves size
                ...get_bb_details(document.documentElement, true, false)
            }
        ];


        // MAIN_SEARCH_RESULT (blue links)
        // selector: '#search .g h3'
        // selector title: '.g h3' | selector snippet: '.g .IsZvec'
        // e.g. any search
        // TODO: check calculator, weather, etc.

        // RELATED_SEARCH (almost all webpages)
        // selector: '.s75CSd'


        // "PEOPLE_ASK_CLOSED", "PEOPLE_ASK_OPEN"
        // selector: '.related-question-pair'
        // open accordions can be identified if element.innerText contains \n
        // (as in CoNotate: https://github.com/creativecolab/CHI2021-CoNotate/blob/4243ed81a944d7429adbfa934873c10c005f1b39/ChromeExtension/src/mainContent.js#L267
        // open / expanded accordions have additional g elements inside them
        // RELATED_SEARCH_NESTED_RESULT
        // selector '.g'
        // e.g. "jquery document ready" , "weather"

        //"PEOPLE_ALSO_SEARCH" (example?)

        // 'KNOWLEDGE_PANEL'
        // visible '.g h3' that does not have closest 'a'



        // ----------- main search results ("ten blue links") -----------
        document.querySelectorAll('.g').forEach(function(g, g_i)
        {
            // log div.g result only if it contains h3
            // otherwise it may not be primary blue link search result
            // e.g. weather

            const h3 = g.querySelector('h3')

            // if there is h3 inside, then it is "blue link"
            // visible h3 will have innerText as non-empty string
            // hidden h3 is contained in "people also ask"
            if(h3 && h3.innerText && h3.closest('a'))
            {
                const main_result = {
                    type: 'MAIN_RESULT',
                    index: g_i,
                    result_title: h3.innerText,
                    result_url: h3.closest('a').href,
                    result_snippet: "",
                    ...get_bb_details(g),
                };

                //snippet
                if(g.querySelector('.IsZvec'))
                    main_result.result_snippet = g.querySelector('.IsZvec').innerText;

                // add to mother array
                serp_elements.push(main_result);

                // nested results inside this main result
                g.querySelectorAll('a').forEach(function(a, a_i)
                {
                    if(a.href !== main_result.result_url && visible(a))
                    {
                        const nested_result = {
                            type: 'NESTED_RESULT',
                            parent_index: g_i,
                            result_title: a.innerText,
                            index: a_i,
                            result_url: a.href,
                            ...get_bb_details(a),
                        };

                        serp_elements.push(nested_result);
                    }
                });
            }
            else if(g_i.innerText)
            {
                const other_result = {
                    type: 'OTHER',
                    index: g_i,
                    ...get_bb_details(g),
                }

                serp_elements.push(other_result);
            }
        });



        // ----------- suggestion: related search  -----------
        document.querySelectorAll('.s75CSd').forEach(function(e, i)
        {
            const related_search = {
                type: 'RELATED_SEARCH',
                index: i,
                query_suggestion: e.innerText, //related search query
                result_url: e.closest('a') ? e.closest('a').href : "",
                ...get_bb_details(e),
            };

            // add to array
            serp_elements.push(related_search);

        });



        // ----------- suggestion: people also ask  -----------
        document.querySelectorAll('.related-question-pair').forEach(function(e, i)
        {
            // whether the "people also ask" accordion is open (expanded)
            // to show details, or closed
            const loc_newline = e.innerText.indexOf('\n');

            // closed
            if(loc_newline < 0)
            {
                const people_ask_closed = {
                    type: 'PEOPLE_ASK_CLOSED',
                    index: i,
                    query_suggestion: e.innerText,
                    ...get_bb_details(e),
                };

                serp_elements.push(people_ask_closed);
            }
            else // open
            {
                const people_ask_open = {
                    type: 'PEOPLE_ASK_OPEN',
                    index: i,
                    query_suggestion: e.innerText.substring(0, loc_newline),
                    answer_snippet: e.innerText.substring(loc_newline + 1),
                    answer_title: "",
                    answer_url: "",
                    ...get_bb_details(e),
                };

                // answer title
                const g_h3 = e.querySelector('.g h3');
                if(g_h3)
                    people_ask_open.answer_title = g_h3.answer_title;

                const g_h3_a = g_h3.closest('a');
                if(g_h3_a)
                    people_ask_open.answer_url = g_h3_a.href;

                serp_elements.push(people_ask_open);
            }
        });


        // serp_elements.sort(function (a, b)
        // {
        //     //order by y, x
        //     if(a.page_y1 === b.page_y1)
        //         return a.page_x1 - b.page_x1;
        //     else
        //         return a.page_y1 - b.page_y1;
        // })

        // console.log(serp_elements);

        return serp_elements;
    }






// ---------------------------------- utility functions ------------------------------------
    function get_viewport_properties()
    {
        return {
            // viewport properties
            zoom: window.devicePixelRatio,
            page_w: parseInt(document.documentElement.scrollWidth), //page width
            page_h: parseInt(document.documentElement.scrollHeight), //page height
            viewport_w: parseInt(document.documentElement.clientWidth), //viewport width
            viewport_h: parseInt(document.documentElement.clientHeight), //viewport height
            browser_w: parseInt(window.outerWidth), //browser window width
            browser_h: parseInt(window.outerHeight), //browser window height
            page_scrolled_x: parseInt(window.pageXOffset), //page horizontally scrolled
            page_scrolled_y: parseInt(window.pageYOffset), //page vertically scrolled
        }
    }



    // get bounding box details
    function get_bb_details(e, dump_innerT=true, dump_innerH=true)
    {
        const bb_rect = e.getBoundingClientRect();

        // absolute bounding box (w.r.t. screen, for eye-tracker coordinates)
        // experimental: https://stackoverflow.com/a/29370069
        // will not work if dev toolbar or other window
        // decreases viewport width from the bottom
        const screen_x1 = window.screenX // window position relative to screen
            + bb_rect.left;

        const screen_y1 = window.screenY // window position relative to screen
            + window.outerHeight - window.innerHeight // height of navigation/toolbar
            +bb_rect.top;

        const screen_x2 = screen_x1 + bb_rect.width;
        const screen_y2 = screen_y1 + bb_rect.height;

        const page_x1 = bb_rect.left + window.scrollX;
        const page_y1 = bb_rect.top + window.scrollY;
        const page_x2 = page_x1 + bb_rect.width;
        const page_y2 = page_y1 + bb_rect.height;


        return {
            //relative to entire
            page_x1: parseInt(page_x1),
            page_y1: parseInt(page_y1),
            page_x2: parseInt(page_x2),
            page_y2: parseInt(page_y2),

            // relative to screen
            screen_x1: parseInt(screen_x1),
            screen_y1: parseInt(screen_y1),
            screen_x2: parseInt(screen_x2),
            screen_y2: parseInt(screen_y2),

            //innerText and innerHTML
            inner_text: dump_innerT ? e.innerText : "",
            inner_html: dump_innerH ? compress_html_string(e.innerHTML) : "",
        }
    }

    // whether HTML element is visbile
    // https://stackoverflow.com/a/33456469
    function visible(elem)
    {
        return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
    }

}
catch (err){
    err.stack();
    console.trace();
    //console.log(`Error: ${err.toString()}`);
}
} //main()

// calling the main function
main();













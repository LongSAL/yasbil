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

function main()
{
    console.log('hello');

    const url = window.location.href;

    if(!is_tracking_allowed(url))
        return;

    const p_BG_interaction = browser.runtime.connect({name:"port-ba-popup-to-bg"});

    const se_info = get_search_engine_info(window.location.href);
    console.log(se_info);

    scrape_serp();

    // for debouncing very rapidly firing events
    // using whatever keys as desired
    const PREV_LOG ={
        'ts_hover': new Date().getTime(),
        'ts_move': new Date().getTime(),
        'mouse_x': -1,
        'mouse_y': -1,
        'scroll_x': 0,
        'scroll_y': 0,
    }

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
    document.addEventListener('click', function(e) {
        cs_log_mouse_and_scroll('MOUSE_CLICK', e, e.target.closest('a'));
        //TODO: rescrape SERP (assuming: SERP is updated only with clicks)
    });

    // ----------- right click -----------
    document.addEventListener('contextmenu', function(e) {
        cs_log_mouse_and_scroll('MOUSE_RCLICK', e, e.target.closest('a'));
        //TODO: rescrape SERP (assuming: SERP is updated only with clicks)
        // maintain last scrape and compare?
    });

    // ----------- double click -----------
    document.addEventListener('dblclick', function(e) {
        cs_log_mouse_and_scroll('MOUSE_DBLCLICK', e, e.target.closest('a'));
    });


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
        e_name, e,
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


        if(e.hasOwnProperty('target')) //possibly not true for SCROLL
        {
            target_text = e.target.innerText+'';
            target_html = e.target.innerHTML;

            const bb_rect = e.getBoundingClientRect();
            target_width = bb_rect.width;
            target_height = bb_rect.height;

            let el = e.target;
            while (el) {
                dom_path_arr.push(el.tagName.toUpperCase());
                if(!el.parentElement)
                    break
                el = el.parentElement;
            }
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
    function scrape_serp()
    {
        if(!se_info.search_engine)
            return;

        const msg_obj = {
            yasbil_msg: "LOG_SERP_SCRAPE",
            yasbil_scrape_data: {
                scrape_ts: new Date().getTime(),
                ...get_viewport_properties(),

                search_engine: se_info.search_engine,
                search_query: se_info.search_query,

                //TODO
                serp_pg_no: se_info.serp_pg_no,

                scraped_json_obj: null,


            }
        }

        let scrape_obj = null;

        switch (se_info.search_engine)
        {
            case "GOOGLE":
                 scrape_obj = scrape_google_serp();
                break;
            case "BING":
                break;

        }

        msg_obj.yasbil_scrape_data.scraped_json_obj = scrape_obj;
    }



    // ---------- scrape Google SERP (haha!) ------------
    function scrape_google_serp()
    {
        // https://scraperbox.com/blog/how-to-scrape-google-search-results-with-python

        //array of objects to store the boxes/ client rects in the serp
        // box / rect can be of the following types
        // - 'DOCUMENT
        // - 'MAIN_SEARCH_RESULT'
        // - 'NESTED_SEARCH_RESULT'
        // - 'RELATED_SEARCHES'
        // - 'PEOPLE_ALSO_ASK'
        // - 'PEOPLE_ALSO_SEARCH'
        // order by page_y, page_x to sort of "recreate page
        // to get parent of nested element:
        // - parent x1 <= child x1, child x2 <= parent x2
        // - parent y1 <= child y1, child y2 <= parent y2
        const serp_elements = [
            {
                type: 'DOCUMENT',
                ...get_bb_details(document.documentElement)
            }
        ];

        // MAIN_SEARCH_RESULT (blue links)
        // selector: '#search .g h3'
        // selector title: '.g h3' | selector snippet: '.g .IsZvec'
        // e.g. any search
        // TODO: check calculator, weather, etc.



        const result_obj = {
            // main search results (blue links)
            // selector: '#search .g h3'
            // selector title: '.g h3' | selector snippet: '.g .IsZvec'
            // e.g. any search
            // TODO: check calculator, weather, etc.
            search_results: [],

            //"related searches" (almost all webpages)
            //
            related_searches: [],

            // "people also ask"
            // selector: '.related-question-pair'
            // e.g. "jquery document ready" , "weather"
            ppl_ask: [],

            //"people also search" (example?)
            ppl_search: []

        }

        // ----------- main search results -----------
        console.log('----------- main search results -----------');
        document.querySelectorAll('.g').forEach(function(g, i)
        {
            try
            {
                // log div.g result only if does not belong to
                // people also ask ('.related-question-pair')
                // e.g. weather
                if(g.querySelector('h3').innerText)
                {
                    const search_result_i = {
                        ...get_bb_details(g),
                        main_title: "",
                        main_url: "",
                        snippet: "",
                        inner_text: g.innerText,
                        inner_html: g.innerHTML,
                        nested_results:[] // visible nested urls that are different from main url
                    };

                    //main_title and main_url (contained in .g h3)
                    const h3 = g.querySelector('h3')
                    if(h3)
                    {
                        search_result_i.main_title = h3.innerText;

                        // closest a may not be found for knowledge panels
                        if(h3.closest('a'))
                            search_result_i.main_url = h3.closest('a').href;
                    }

                    //snippet
                    if(g.querySelector('.IsZvec'))
                        search_result_i.snippet = g.querySelector('.IsZvec').innerText;

                    // nested results
                    g.querySelectorAll('a').forEach(function(a, a_i)
                    {
                        if(a.href !== search_result_i.main_url && visible(a))
                        {
                            search_result_i.nested_results.push({
                                title: a.innerText,
                                url: a.href,
                                ...get_bb_details(a),
                            });
                        }
                    });

                    // add to array
                    result_obj.search_results.push(search_result_i);

                    console.log(
                        (i+1), '||',
                        //parseInt(search_result_i.page_y.toFixed(0)), '||',
                        search_result_i.main_url ? new URL(search_result_i.main_url).hostname : "", '||',
                        search_result_i.main_title, '||',
                        search_result_i.snippet.substr(0, 50),
                    );

                    for(let elem of search_result_i.nested_results)
                    {
                        console.log(
                            '\t',
                            elem.title, '||',
                            elem.url ? new URL(elem.url).hostname : "",
                        );
                    }
                }
            }
            catch (err) {
                console.log(`Error: ${err.toString()}`);
            }

        });


        // ----------- related searches -----------
        console.log('----------- related searches -----------');
        document.querySelectorAll('.s75CSd').forEach(function(e, i)
        {
            const related_search_i = {
                'page_y': e.getBoundingClientRect().top + window.scrollY,
                'page_x': e.getBoundingClientRect().left + window.scrollX,
                'url': e.closest('a').href,
                'inner_text': e.innerText, //contains the related search query
                'inner_html': e.innerHTML,
            };

            // add to array
            result_obj.related_searches.push(related_search_i);

            console.log(
                (i+1), '||',
                //parseInt(related_search_i.page_y.toFixed(0)), '||',
                related_search_i.inner_text,
            );
        });








        console.log(result_obj);

        return result_obj;
    }


// ---------------------------------- utility functions ------------------------------------
    function get_viewport_properties()
    {
        return {
            // viewport properties
            zoom: window.devicePixelRatio,
            page_w: parseInt(document.documentElement.scrollWidth), //page width
            page_h: parseInt(document.documentElement.scrollHeight), //page height
            page_scrolled_x: parseInt(window.pageXOffset), //page horizontally scrolled
            page_scrolled_y: parseInt(window.pageYOffset), //page vertically scrolled
            viewport_w: parseInt(document.documentElement.clientWidth), //viewport width
            viewport_h: parseInt(document.documentElement.clientHeight), //viewport height
            browser_w: parseInt(window.outerWidth), //browser window width
            browser_h: parseInt(window.outerHeight), //browser window height
        }
    }

    // get bounding box details
    function get_bb_details(e)
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
        }
    }

    // whether HTML element is visbile
    // https://stackoverflow.com/a/33456469
    function visible(elem)
    {
        return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
    }


} //main()

// calling the main function
main();













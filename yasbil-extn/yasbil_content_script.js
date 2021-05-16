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

const p_BG_interaction = browser.runtime.connect({name:"port-ba-popup-to-bg"});


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



//log mouse move after x milliseconds (// NOTE: (Huang+, CHI'11)'s method not working)
// const MOVE_LOG_THRESH = 1000;

// log hover events only if greater than x milliseconds
const HOVER_DUR_THRESH = 100; // as low a number, more like mousemove; original: 500 1`0;
// const HOVER_LOG_THRESH = 1000;

// log scroll events only if amount scrolled is
// greater than x% of page width or page height
const SCROLL_Y_THRESH = 1;
const SCROLL_X_THRESH = 1;



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
    let target_text = '', target_html = '';

    if(e.hasOwnProperty('target')) //possibly not true for SCROLL
    {
        target_text = e.target.innerText+'';
        target_html = e.target.innerHTML

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

            //only if closest a found
            closest_a_text: '',
            closest_a_html: '',

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









// ---------------------------------- utility functions ------------------------------------
function get_viewport_properties(){
    return {
        // viewport properties
        zoom: window.devicePixelRatio,
        page_w: document.documentElement.scrollWidth, //page width
        page_h: document.documentElement.scrollHeight, //page height
        page_scrolled_x: window.pageXOffset, //page horizontally scrolled
        page_scrolled_y: window.pageYOffset, //page vertically scrolled
        viewport_w: document.documentElement.clientWidth, //viewport width
        viewport_h: document.documentElement.clientHeight, //viewport height
        browser_w: window.outerWidth, //browser window width
        browser_h: window.outerHeight, //browser window height
    }
}













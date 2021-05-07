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
 *
 *
 * WHEEL: https://www.w3schools.com/jsref/obj_wheelevent.asp
 *
 */


// let portToBG2 = browser.runtime.connect({name:"port-ba-popup-to-bg-2"});
//console.log(portToBG);

const p_BG_interaction = browser.runtime.connect({name:"port-ba-popup-to-bg"});
// NOTE: (Huang+, CHI'11)'s method not working
//log mouse move after x milliseconds
const MOVE_LOG_THRESH = 1000;
let prev_move_log_ts = new Date().getTime();
//let prev_mouse_x = -1, prev_mouse_y = -1;

// log hover events only if greater than x milliseconds
const HOVER_DUR_THRESH = 50; // as low a number, more like mousemove; original: 500 1`0;
// let prev_hover_log_ts = new Date().getTime();
// const HOVER_LOG_THRESH = 1000;



// -------------------- MOUSE event listeners --------------------


// global mousemove
// TODO: is mousemove necessary? or mousehover enough?
// document.addEventListener('mousemove', listener_mousemove);
// function listener_mousemove(e){
//     const timenow = new Date().getTime()
//     if((timenow - prev_move_log_ts) > MOVE_LOG_THRESH){
//         cs_log_mouse('MOUSE_MOVE', e);
//         prev_move_log_ts = timenow;
//     }
// }


// hover duration: mouseneter + mouseleave
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
        cs_log_mouse('MOUSE_HOVER', e, e.target.closest('a'), hover_dur);
    }
});

//left click
document.addEventListener('click', function(e) {
    cs_log_mouse('MOUSE_CLICK', e, e.target.closest('a'));
});

//right click
document.addEventListener('contextmenu', function(e) {
    cs_log_mouse('MOUSE_RCLICK', e, e.target.closest('a'));
});

//double click
document.addEventListener('dblclick', function(e) {
    cs_log_mouse('MOUSE_DBLCLICK', e, e.target.closest('a'));
});



// -------------------- MOUSE handler --------------------
// single function to log all mouse interaction events from content script (cs)
function cs_log_mouse(e_name, e, closest_a = null, hover_dur= 0)
{
    //log mouse move only after THRESH time interval
    // if(e_name === 'MOUSE_MOVE' && (new Date().getTime() - prev_move_log_ts) < MOVE_LOG_THRESH)
    //     return;

    let sendMsg = true;

    // getting dom_branch to parent
    // https://stackoverflow.com/a/8729274
    let el = e.target;
    let dom_path_arr = [];
    while (el) {
        dom_path_arr.push(el.tagName.toUpperCase());
        if(!el.parentElement)
            break
        el = el.parentElement;
    }

    // constant data for all mouse interaction events
    const msg_obj = {
        yasbil_msg: "DB_LOG_MOUSE",
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

            target_text: e.target.innerText+'', //rendered text of the target element
            target_html: e.target.innerHTML, //html of the target element

            //only if closest a found
            closest_a_text: '',
            closest_a_html: '',

            //for hover and click events
            mouse_x: -1,
            mouse_y: -1,

            // for hover event (mouseout - mousein)
            hover_dur: hover_dur,
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

        //prev_move_log_ts = msg_obj.yasbil_ev_data.e_ts;
        // prev_mouse_x = e.pageX;
        // prev_mouse_y = e.pageY;

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

    // console.log(msg_obj.yasbil_ev_data);
    // console.log('CS:', e_name, new Date().getTime());
}



// -------------- SCROLL -----------------------
// using WHEEL or using SCROLL?
// other keyboard events?
/*window.addEventListener('scroll', function (e)
{
    const msg_obj = {
        yasbil_msg: "DB_LOG_SCROLL",
        yasbil_ev_data: {
            e_name: 'SCROLL',
            e_ts: new Date().getTime(),

            //getting viewport properties (using ES6 spread notation)
            // https://stackoverflow.com/a/36044262
            ...get_viewport_properties(),


        }
    };

    p_BG_interaction.postMessage(msg_obj);
    console.log(msg_obj.yasbil_ev_data);
    console.log('CS:', 'SCROLL', new Date().getTime());

});*/







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


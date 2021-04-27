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
//log mouse move only if cursor stable for 40 milliseconds
// (Huang+, CHI'11)'s method not working
const MOUSE_LOG_THRESH = 1 * 1000;
let prev_move_log_ts = new Date().getTime();
//let prev_mouse_x = -1, prev_mouse_y = -1;

// -------------------- event listeners --------------------


// global mousemove
// document.addEventListener('mousemove', listener_mousemove);
// function listener_mousemove(e){cs_log_interaction('MOUSE_MOVE', e);}

// mouseover on anchors
document.addEventListener('mouseover', function(e) {
    const closest_a = e.target.closest('a');
    if(closest_a){
        cs_log_interaction('MOUSE_HOVER_ANCHOR', e, closest_a);
    }
});

//mouseclick
document.addEventListener('click', function(e) {
    const closest_a = e.target.closest('a');
    if(closest_a){
        cs_log_interaction('MOUSE_CLICK_ANCHOR', e, closest_a);
    }
    else{
        cs_log_interaction('MOUSE_CLICK', e);
    }
});

document.addEventListener('contextmenu', function(e) {
    const closest_a = e.target.closest('a');
    if(closest_a){
        cs_log_interaction('MOUSE_RCLICK_ANCHOR', e, closest_a);
    }
    else{
        cs_log_interaction('MOUSE_RCLICK', e);
    }
});

/*
console.log('2');
// anchor (link) mouse over (hover) and click
const a_tags_list = document.querySelectorAll('a')
for (const a_tag of a_tags_list)
{
    a_tag.addEventListener('mouseover', function(e) {
        cs_log_interaction('MOUSE_HOVER_ANCHOR', e);
    });

    a_tag.addEventListener('click', function(e) {
        cs_log_interaction('MOUSE_CLICK_ANCHOR', e);
    });
}
console.log('3');

// global click
document.body.addEventListener('click', listener_click);
function listener_click(e){}
*/
//
// console.log('4');
//
// // global right click
// document.body.addEventListener('contextmenu', listener_contextmenu);
// function listener_contextmenu(e){cs_log_interaction('MOUSE_RCLICK', e);}
//
// console.log('5');
//
// document.body.addEventListener('dblclick', listener_dblclick);
// function listener_dblclick(e){cs_log_interaction('MOUSE_DBLCLICK', e);}
//
// console.log('6');
//
// document.body.addEventListener('scroll', listener_scroll);
// function listener_scroll(e){cs_log_interaction('SCROLL', e);}
//
// console.log('7');

// -------------------- handler --------------------
// single helper function to log all interaction events from content script (cs)

function cs_log_interaction(e_name, e, closest_a = null)
{
    //log mouse move only after THRESH time interval
    if(e_name === 'MOUSE_MOVE' && (new Date().getTime() - prev_move_log_ts) < MOUSE_LOG_THRESH)
        return;

    let sendMsg = true;

    // getting dom_branch to parent
    // https://stackoverflow.com/a/8729274
    let el = e.target;
    let parent_els = [];
    while (el){
        parent_els.push(el.tagName.toUpperCase());
        if(!el.parentElement)
            break
        el = el.parentElement;
    }

    // constant data for all interaction events
    const msg_obj = {
        yasbil_msg: "DB_LOG_INTERACTION",
        yasbil_ev_data: {
            e_name: e_name,
            e_ts: new Date().getTime(),
            //page_url: window.location.href, //obtained by tabInfo

            dom_branch: parent_els.join('|'), //path from current element upto <HTML> in DOM

            zoom: window.devicePixelRatio,

            page_w: document.documentElement.scrollWidth, //page width
            page_h: document.documentElement.scrollHeight, //page height
            page_x: window.pageXOffset, //page horizontally scrolled
            page_y: window.pageYOffset, //page vertically scrolled
            viewport_w: document.documentElement.clientWidth, //viewport width
            viewport_h: document.documentElement.clientHeight, //viewport height
            browser_w: window.outerWidth, //browser window width
            browser_h: window.outerHeight, //browser window height

            target_text: e.target.innerText+'', //rendered text of the target element
            target_html: e.target.innerHTML, //html of the target element

            closest_a_text: '',
            closest_a_html: '',
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

        prev_move_log_ts = msg_obj.yasbil_ev_data.e_ts;
        // prev_mouse_x = e.pageX;
        // prev_mouse_y = e.pageY;

    }
    else if([
        'MOUSE_HOVER_ANCHOR',
        'MOUSE_CLICK_ANCHOR',
        'MOUSE_CLICK',
        'MOUSE_RCLICK_ANCHOR',
        'MOUSE_RCLICK'
    ].includes(e_name))
    {

        //X-Y location of the mouse pointer
        msg_obj.yasbil_ev_data.mouse_x = e.pageX;
        msg_obj.yasbil_ev_data.mouse_y = e.pageY;

    }
    else if(e_name === 'SCROLL')
    {
        // no additional data properties necessary
    }

    if(sendMsg){
        p_BG_interaction.postMessage(msg_obj);
    }

    console.log('CS:', e_name, new Date().getTime());
}





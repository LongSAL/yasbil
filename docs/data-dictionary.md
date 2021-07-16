# YASBIL Data Dictionary

This page describes the various datatables that YASBIL maintains in the browser extension (via IndexedDB) and WordPress Plugin (via MySQL / Mariadb).
Since all the data is read-only, we decided to include the session, project, and user detail columns in each table (non-normalized), thus avoiding the need to write inner join statements whenever data needs to be selected.

## `yasbil_sessions`

- Master Table.  Records all session: start and stop of browser extn
- one userid is associated with one project only
- MySQL TIMESTAMP stores seconds
- Javascripts Date().getTime() returns milliseconds

| **Column** | **Description** |
| ----------- | ----------- |
| `session_id` | server only; PK; auto-increment |
| `session_guid` | PK in client |
|`project_id` | (numeric) server only; identifies which IIR project participant is assocated with|
|`project_name` | (string) server only; identifies which IIR project participant is assocated with|
|`user_id`  | server only (WordPress User ID) |
|`user_name`  | WordPress User Name; use as codename of participant |
|`platform_os`| `platform_info.os`|
|`platform_arch`| `platform_info.arch`|
|`platform_nacl_arch`| `platform_info.nacl_arch` native client architecture)|
|`browser_name`| `browser_info.name`|
|`browser_vendor`| `browser_info.vendor`|
|`browser_version`| `browser_info.version`|
|`browser_build_id`| `browser_info.buildID`|
|`session_tz_str` | |
|`session_tz_offset` | |
|`session_start_ts` | |
|`session_end_ts` | |
|`sync_ts` | initial = 0; later populated with timestamps from MySQL response |

 

 ----------------
 
## `yasbil_session_pagevisits`

- Page Visits in a Session, similar to `moz_places`
- captured from three events:
    - [webNavigation.onCompleted](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onCompleted)
        - captures main page visit events, only AFTER the page has completely loaded
    - [tabs.onActivated](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onActivated)
        - captures tab switches: user switches back to a webpage-tab previously opened
    - [webNavigation.onHistoryStateUpdated](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onHistoryStateUpdated)
        - to capture webpages like YouTube which do not fire `webNavigation.onCompleted events`
        - Note: this event may be fired multipe times before page has completely loaded 

- [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText) and [`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) to capture page content, and see if text on page come up in future search query terms
    - YouTube fires `onHistoryStateUpdated` **before** the page has completely loaded; so these properties may contain stale values from previous page  
    
- the `project` and `user` columns are repeated to avoid excessive table joins; since all data is read-only, we don;t expect issues that typically arise due to non-normalized databases
 
| **Column** | **Description** |
| ----------- | ----------- |
|`pv_id`|server only; PK; auto-increment|
|`pv_guid`| PK in client|
|`session_guid`||
|--------------|--------------|
|`project_id` | (numeric) server only; identifies which IIR project participant is assocated with|
|`project_name` | (string) server only; identifies which IIR project participant is assocated with|
|`user_id`  | server only (WordPress User ID) |
|`user_name`  | server only; WordPress User Name; use as codename of participant |
|--------------|--------------|
|`win_id`||
|`win_guid`|unique ID for the browser window in which pagevisit occurs|
|`tab_id`||
|`tab_guid`|unique ID for the browser tab in which pagevisit occurs|
|`tab_width`||
|`tab_height`||
|--------------|--------------|
|`pv_ts`|timestamp of webpage visit|
|`pv_event`| event that caused the pagevisit: <br/> `YASBIL_SESSION_START`: all the tabs at the start of a recording session <br/>`webNavigation.onCompleted`: page has finished loading <br/>`tabs.onActivated`: user switched to a previously opened tab <br/>`webNavigation.onHistoryStateUpdated`: page updated the browser history record|
|`pv_url`||
|`pv_title`||
|`pv_hostname`||
|`pv_rev_hostname`| for easy lookup of TLD types visited|
|`pv_transition_type`| [Transition type](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history/TransitionType)|
|`pv_page_text`|captured using `document.body.innerText` after page has loaded |
|`pv_page_html`|captured using `document.body.innerText` after page has loaded |
|`hist_ts`| Timestamp of pagevisit as stored in browser history. Select DISTINCT or group by this column to deal with redundant rows|
|`hist_visit_ct`||
|`pv_search_engine`|name of search engine, if current URL is a SERP|
|`pv_search_query`|search query submitted, if current URL is a SERP, extracted from query parameters|
|`sync_ts`| initial = 0; later popl with ts from MySQL response|



TODO: add open-graph tags of page? (to identify type of webpage, etc)

----------------
 
## `yasbil_session_mouse`
- captures mouse activity
- since scroll events are fired rapidly, a scoll event is logged only when user has scrolled at least 1% of the page width or page height
 
| **Column** | **Description** |
| ----------- | ----------- |
|`m_id`|server only; PK; auto-increment|
|`m_guid`|PK in client|
|`session_guid`||
|--------------|--------------|
|`project_id` | (numeric) server only; identifies which IIR project participant is assocated with|
|`project_name` | (string) server only; identifies which IIR project participant is assocated with|
|`user_id`  | server only (WordPress User ID) |
|`user_name`  | server only; WordPress User Name; use as codename of participant |
|--------------|--------------|
|`win_id`||
|`win_guid`|unique ID for the browser window in which mouse activity occurs|
|`tab_id`||
|`tab_guid`|unique ID for the browser tab in which mouse activity occurs|
|--------------|--------------|
|`m_ts`|timestamp of mouse activity|
|`m_event`|Mouse event type: `MOUSE_HOVER`, `MOUSE_CLICK`,  `MOUSE_RCLICK`, `MOUSE_DBLCLICK`, `SCROLL`|
|`m_url`|url of the page|
|--------------|--------------|
|`zoom`| `window.devicePixelRatio` zoom level in fraction; use `(Math.round(value)*100)` for percentage|
|`page_w`| `document.documentElement.scrollWidth` webpages's scrollable width (should be equal to viewport width, if there is no horizontal scrolling)|
|`page_h`| `document.documentElement.scrollHeight` webpage's scrollable height|
|`viewport_w`| `document.documentElement.clientWidth` width of viewport, excluding scrollbars|
|`viewport_h`| `document.documentElement.clientHeight` height of viewport, excluding scrollbars|
|`browser_w`| `window.outerWidth` width of entire browser window; changes with zoom level|
|`browser_h`| `window.outerHeight` height of entire browser window; changes with zoom level|
|`page_scrolled_x`| `window.pageXOffset` page horizontally scrolled, frop top left|
|`page_scrolled_y`| `window.pageYOffset` page vertically scrolled, from top left|
|--------------|--------------|
|`mouse_x`| `MouseEvent.pageX` X (horizontal) coordinate (in pixels) at which the mouse was clicked, relative to the left edge of the entire document. This includes any portion of the document not currently visible|
|`mouse_y`| `MouseEvent.pageY` Y (vertical) coordinate in pixels of the event relative to the whole document. This property takes into account any vertical scrolling of the page|
|`hover_dur`|duration of hover (if `MOUSE_HOVER` event) in milliseconds|
|--------------|--------------|
|`dom_path`|sequence of element tags up the DOM hierarchy from the target element to HTML (aka modified xpath)|
|`target_text`|rendered text of the target element of the event|
|`target_html`|`innerHTML` of the target element of the event|
|`target_width`| width of the target (px)|
|`target_height`| height of the target (px)|
|--------------|--------------|
|`closest_a_text`|rendered text of the closest anchor tag / link (`<a>`) from the event's target element, if exists|
|`closest_a_html`|`innerHTML` of the closest anchor tag / link (`<a>`) from the event's target element, if exists|
|`closest_a_width`|width of the closest anchor tag (px)|
|`closest_a_height`|height of the closest anchor tag (px)|
|--------------|--------------|
|`scroll_x_delta`|amount of horizontal pixels scrolled in current `SCROLL` event, recorded for every 1% of page width or more |
|`scroll_y_delta`|amount of vertical pixels scrolled in current `SCROLL` event, recorded for every 1% of page height or more|
|--------------|--------------|
|`sync_ts` | initial = 0; later populated with timestamps from MySQL response |



### More Resources:
- [How to Get the Screen, Window, and Web Page Sizes in JavaScript](https://dmitripavlutin.com/screen-window-page-sizes/)
- [Guide on Viewports](https://www.quirksmode.org/mobile/viewports.html)



------------

## `yasbil_session_serp`
- stores scrapes of popular SERPs (currently Google is implemented)
- stores query and search results (thanks to wonderful [CoNotate plugin](https://github.com/creativecolab/CHI2021-CoNotate))
- contents of this table are experimental, depending on major search engines not modifying their SERP HTML structure 
- <span style="color:red"><b>Known Issue:</b> SERPs preloaded before YASBIL is started will not be scraped. User needs to reload the SERP for scraping to occur.</span>.

| **Column** | **Description** |
| ----------- | ----------- |
|`serp_id`|server only; PK; auto-increment|
|`serp_guid`|PK in client|
|`session_guid`||
|--------------|--------------|
|`project_id` | (numeric) server only; identifies which IIR project participant is assocated with|
|`project_name` | (string) server only; identifies which IIR project participant is assocated with|
|`user_id`  | server only (WordPress User ID) |
|`user_name`  | server only; WordPress User Name; use as codename of participant |
|--------------|--------------|
|`win_id`|server only; |
|`win_guid`|unique ID for the browser window in which mouse activity occurs|
|`tab_id`|server only; |
|`tab_guid`|unique ID for the browser tab in which mouse activity occurs|
|--------------|--------------|
|`serp_ts`|timestamp of scraping the SERP|
|`serp_url`|url of the SERP|
|`search_engine`|name of search engine (currently only GOOGLE)|
|`search_query`|search query, extracted from URL parameter|
|`serp_offset`|rank of the first result in this SERP; if 0 => first page of SERP; greater than 0 => not the first page|
|--------------|--------------|
|`scraped_json_arr`|JSON array of objects; details below|
|--------------|--------------|
|`zoom`| `window.devicePixelRatio` zoom level in fraction; use `(Math.round(value)*100)` for percentage|
|`page_w`| `document.documentElement.scrollWidth` webpages's scrollable width (should be equal to viewport width, if there is no horizontal scrolling)|
|`page_h`| `document.documentElement.scrollHeight` webpage's scrollable height|
|`viewport_w`| `document.documentElement.clientWidth` width of viewport, excluding scrollbars|
|`viewport_h`| `document.documentElement.clientHeight` height of viewport, excluding scrollbars|
|`browser_w`| `window.outerWidth` width of entire browser window; changes with zoom level|
|`browser_h`| `window.outerHeight` height of entire browser window; changes with zoom level|
|`page_scrolled_x`| `window.pageXOffset` page horizontally scrolled, frop top left|
|`page_scrolled_y`| `window.pageYOffset` page vertically scrolled, from top left|
|--------------|--------------|
|`sync_ts` | initial = 0; later populated with timestamps from MySQL response |



- Google SERP JSON object types, contained in `scraped_json_arr`

```
{
    type: 'DOCUMENT',
}
```

```
{
    type: 'MAIN_RESULT',
    index: location in array (maybe non continuous, due to hidden elements),
    result_title: title of the result,
    result_url: url of the result,
    result_snippet: result snippet,
}
```

```
{
    type: 'NESTED_RESULT',
    index: location in array (maybe non continuous, due to hidden elements),
    parent_index: index of parent MAIN_RESULT,
    result_title: title of result
    result_url: url of result,
}
```

```
{
    type: 'RELATED_SEARCH',
    index: i,
    query_suggestion: suggested search query
    result_url: url of result
}
```

```
{
    type: 'PEOPLE_ASK_CLOSED',
    index: i,
    query_suggestion: suggested search query (complete question)
}
```

```
{
    type: 'PEOPLE_ASK_OPEN', --> shows detailed info from one result in a question ansert format
    index: i,
    query_suggestion: suggested search query (complete question)
    answer_snippet: answer to the query,
    answer_title: title of the answer snippet source,
    answer_url: url of the answer snippet source,
}
```

```
{
    type: 'OTHER', --> knowledge panels or other stuff not "blue link"
    index: i
}

```
In addition to the properties above, all objects have contain the following common properties about bounding box details, inner_text, and inner_html
```
{
    // bounding box relative to the top-left corner of the entire webpage (HTML document)
    page_x1: x-coordinate of top-left corner of element,
    page_y1: y-coordinate of top-left corner of element,
    page_x2: x-coordinate of bottom-right corner of element,
    page_y2: y-coordinate of bottom-right corner of element,

    // bounding box relative to the top-left corner of the screen / monitor (experimental)
    screen_x1: x-coordinate of top-left corner of element,
    screen_y1: y-coordinate of top-left corner of element,
    screen_x2: x-coordinate of bottom-right corner of element,
    screen_y2: y-coordinate of bottom-right corner of element,

    //innerText and innerHTML
    inner_text: e.innerText,
    inner_html: e.innerHTML,
}

```



----------

## `yasbil_session_webnav`
- captures [`webnavigation`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation) events as timing signals 
- only for `frameId` = 0, i.e. a tab's top-level browsing context, not in a nested `<iframe>`

| **Column** | **Description** |
| ----------- | ----------- |
|`webnav_id`|server only; PK; auto-increment|
|`webnav_guid`|PK in client|
|`session_guid`||
|--------------|--------------|
|`project_id` | (numeric) server only; identifies which IIR project participant is assocated with|
|`project_name` | (string) server only; identifies which IIR project participant is assocated with|
|`user_id`  | server only (WordPress User ID) |
|`user_name`  | server only; WordPress User Name; use as codename of participant |
|--------------|--------------|
|`tab_id`||
|`tab_guid`|unique ID for the browser tab in which event occurs|
|--------------|--------------|
|`webnav_ts`|timestamp of event (ms since epoch)|
|`webnav_event`|Event type: `onBeforeNavigate`, `onCommitted`,  `onDOMContentLoaded`, `onHistoryStateUpdated`, `onCompleted`|
|`webnav_url`|url of page / frame |
|`webnav_transition_type`|only for `onCommitted` event: [`transitionType`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionType): The reason for the navigation|
|`webnav_transition_qual`|only for `onCommitted` event: [`transitionQualifier`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/TransitionQualifier). Extra information about the navigation|
|--------------|--------------|
|`sync_ts` | initial = 0; later populated with timestamps from MySQL response |



--------
## `yasbil_largestring`
- stores large strings (length > 100) (mainly innerHTMLs and innerTexts) at a single location to reduce upload size and prevent redundancy
- to save space, string guid can be used across sessions
  - `db.string2hash ( string )`
  - `db.hash2string( string_locator )`
- `string_locator` has a format `guid|start_index|end_index` where the string being sought is a substring of the `string_body` from `start_index` to `end_index`;

| **Column** | **Description** |
| ----------- | ----------- |
|`string_id`|server only; PK; auto-increment|
|`string_guid`|PK in client|
|--------------|--------------|
|`project_id` | (numeric) server only; identifies which IIR project participant is assocated with|
|`project_name` | (string) server only; identifies which IIR project participant is assocated with|
|`user_id`  | server only (WordPress User ID) |
|`user_name`  | server only; WordPress User Name; use as codename of participant |
|--------------|--------------|
|`src_url`|URL from where string was originally found|
|`string_body`|body of the string|
|--------------|--------------|
|`sync_ts`| initial = 0; later popl with ts from MySQL response|



-----------

## Extension Development (Important Files)
- This section is in development.
- shared: constants and functions shared used by both content scripts and background scripts














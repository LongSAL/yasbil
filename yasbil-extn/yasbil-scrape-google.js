/**
 * Original Author: nilav
 * Date: 2021-05-11
 * Time: 09:28 PM
 */

// todo:
//  scrape google serp (works for google scholar, image etc?)
//  scrape bing serp
//  scrape duckduckgo?
//  scrape wikipedia?

const observeDOM = (() => {
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    return (obj, callback) => {
        if (!obj || obj.nodeType !== 1) return;

        if (MutationObserver){
            // define a new observer
            const obs = new MutationObserver((mutations) => callback(mutations));
            obs.observe( obj, { childList:true, subtree:true });
        } else if (window.addEventListener) {
            obj.addEventListener('DOMNodeInserted', callback, false);
            obj.addEventListener('DOMNodeRemoved', callback, false);
        }
    }
})();

// Containers we want to scrape (and maybe delete)
const queries = document.getElementsByClassName("g").length > 0 ? document.getElementsByClassName("g") : null;
const peopleAskContainer = document.getElementsByClassName("JolIg mfMhoc")[0] ? document.getElementsByClassName("JolIg mfMhoc")[0].parentNode : null;
const peopleSearchContainer = document.getElementsByClassName("lgJJud")[0];
const searchRelatedContainer = document.getElementsByClassName("A07Bwc")[0];


// Scrape the divs to send to the background script
let scrapeObj;
const srch_engine_info = get_search_engine_info(new URL(document.location.href));
//if (document.location.href.includes('google.com/search'))
if (srch_engine_info.search_engine.includes('GOOGLE'))
{
    scrapeObj = scrapeDivs({
        // document.querySelectorAll('.g .LC20lb')
        // document.querySelectorAll('.g .st')
        scrapeSerp: [queries, ["LC20lb", "st"], false],

        //document.querySelectorAll('.JolIg.mfMhoc') --> does not contain children .related-question-pair
        //document.querySelectorAll('.related-question-pair')
        peopleAlsoAsk: [peopleAskContainer, ["related-question-pair"], true],


        peopleAlsoSearch: [peopleSearchContainer, ["f3LoEf", "iKt1P"], false],

        //document.querySelectorAll('.s75CSd')
        relatedSearches: [searchRelatedContainer, ["s75CSd"], false]
    });

    scrapeObj['scrapeSerp'] = scrapeObj['scrapeSerp'].filter(x => x !== '').join();
}


/** ---------  NOTES -----------
(1): https://scraperbox.com/blog/how-to-scrape-google-search-results-with-python
main search results:
- document.querySelectorAll('#search .g h3')
    .forEach(function(e, i){
        console.log(`[${i+1}]`, e.innerText)
    })

- document.querySelectorAll('#search .g h3')
 .forEach(function(e, i){
        console.log(`[${i+1}]`, parseInt((e.getBoundingClientRect().top + window.scrollY).toFixed(0)), e.innerText)
    })

- document.querySelectorAll('a')
    .forEach(function(e, i){console.log(
        parseInt((e.getBoundingClientRect().top + window.scrollY).toFixed(0)),
        e.innerText,
        e.clientHeight
    )})
---------------------*/

console.log('----------- SCRAPE 1 ------------')
// Connect to the background script
//chromePort.postMessage
console.log
({
    type: "connection",
    data: {
        url: document.location.href,
        timeStamp,
        ...scrapeObj
    }
});


// Functions to help us scrape the divs
const checkContainer = (container, children, callback) => {
    container.forEach(
        container => children.forEach(
            child =>
                [container.getElementsByClassName(child)].forEach(
                    child =>
                        [...child].forEach(
                            child => callback(child)
                        )
                )
        )
    );
}

const timeStamp = Date.now();
const scrapeDivs = (divs) => {
    const scrapeObj = {};
    const keys = Object.keys(divs);
    for (let j = keys.length - 1; j >= 0; --j) {
        let [container, children, watch] = divs[keys[j]];

        if (container) {
            if (container.length) container = [...container];
            else container = [container];

            if (watch) {
                const textArr = [];
                checkContainer(container, children, (ele) => textArr.push({ text: ele.innerText, open: false }));
                scrapeObj[keys[j]] = textArr;

                // Listener for when the div changes
                // We can prevent sending a bunch of data with a debouncer and this data is not urgent
                let timer = null, cancelTimer = null;
                container.forEach(subContainer => observeDOM(subContainer, () => {
                    if (cancelTimer) cancelTimer();
                    timer = setTimeout(() => {
                        const textArr = [];
                        checkContainer(container, children, (ele) => {
                            const text = ele.innerText;
                            textArr.push({
                                text,
                                open: text.indexOf("\n") !== -1
                            })
                        });

                        //chromePort.postMessage
                        console.log('----------- SCRAPE 2 ------------')
                        console.log
                        ({
                            type: "updatePeopleAlsoAsk",
                            data: {
                                timeStamp: timeStamp,
                                peopleAlsoAsk: textArr
                            }
                        });
                    }, 500);
                    cancelTimer = () => clearTimeout(timer);
                }));
            } else {
                const textArr = [];
                checkContainer(container, children, (ele) => textArr.push(ele.innerText));
                scrapeObj[keys[j]] = textArr;
            }
        } else
            scrapeObj[keys[j]] = []
    }

    return scrapeObj;
}



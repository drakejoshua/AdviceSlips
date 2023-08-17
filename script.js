// DOM elements with which our program'll be working with
var favIcon = document.getElementById("fav-icon");
var cancelBtn = document.getElementById("cancelBtn");
var favouriteAdviceElem = document.querySelector("section#liked-advice > div");
var controls = document.querySelector("section#controls");
var mainQuoteCtn = document.querySelector("section#advice");
var mainQuote = document.querySelector("section#advice > h1");
var currentAdviceData = null;
var fetchingStatus = "loading";


// getting the IDs of the favourited advice slips from the local-storage
var favouritedAdvicesIds = JSON.parse( localStorage.getItem("favourite-advices-id") );

if ( favouritedAdvicesIds == null ) {
    favouritedAdvicesIds = [];
}


// an abort controller used to abort/cancel the fetch for both random advice or advice by id
var fetchController = new AbortController();


// api endpoint links 
var RANDOM_ADVICE = "https://api.adviceslip.com/advice";
var ADVICE_BY_ID = "https://api.adviceslip.com/advice/";


// the cancelBtn UI logic
// used to handle UI display logic concerned with "loading cancel button"
cancelBtn.addEventListener( "click", function(event) {
    switch ( fetchingStatus ) {
        case "loading":
            reportCancelFetch();
            
            fetchingStatus = "cancelled";

            fetchController.abort();
            clearInterval( interval );
        break;
        
        case "cancelled":
            reportStartFetch();

            fetchingStatus = "loading";

            fetchController = new AbortController();

            fetchRandomAdviceSlip();
            interval = setInterval( runningFetch, 6000 );
        break;
            
        case "error":
            reportStartFetch();

            fetchingStatus = "loading";

            fetchController = new AbortController();

            fetchRandomAdviceSlip();
            interval = setInterval( runningFetch, 6000 );
        break;

        case "successful":
            reportStartFetch();

            fetchingStatus = "loading";
        break;
    }
});



// the favIcon "UI selection" logic
// used to handle UI display logic concerned with "like advice" icon
// and handling the favourited/unfavourited state of an advice slip
favIcon.addEventListener( "click", function(event) {
    // checking if the advice slip is favourited , if so, unfavouriting it
    // if not, favouriting it
    if ( event.target.classList.contains("fas") ) {
        unfavouriteSlip();
    } else {
        favouriteSlip();
    }

    // changing the UI display of the icon
    event.target.classList.toggle("fas");
});



// making the initial running fetch
var interval;
var firstFetchSuccessful = fetchRandomAdviceSlip();


// setting the interval timer in order to display random advices after 6s if the initial fetch was successful
// if not, display fetch error
// also display the favourited slip list
firstFetchSuccessful.then( function( isSuccessful ) {
    if ( isSuccessful ) {
        interval = setInterval( runningFetch, 6000 );
    } else {
        reportErrorFetch();
    }

    console.log( isSuccessful );
});
displayFavouritedSlipList();


// the runningFetch()
// to continually fetch random advices on the interval
function runningFetch() {
    // initiating a fetch in the UI
    reportStartFetch();

    // fetching a random advice
    setTimeout( () => { fetchRandomAdviceSlip() }, 1000 );
}


// the fetchRandomAdviceSlip()
// used to asynchrously fetch random advice and return a promise if they're successfully 
// fetched or not
async function fetchRandomAdviceSlip() {
    try {
        reportStartFetch();

        const res = await fetch(RANDOM_ADVICE, { cache: "no-store",
                                                 signal: fetchController.signal });

        if ( res.status === 200 ) {
            fetchingStatus = "successful";

            const data = await res.json();

            currentAdviceData = data;
            displayFetchedSlip(data);
            
            return true;
        } else {
            throw new Error("FetchError");
        }
    } catch (error) {
        if (error.message === "FetchError") {
            reportErrorFetch();
            fetchingStatus = "error";
        }

        return false;
    }
}


// the report* functions 
// used to display/update changes in the UI due to application state
function reportFavouriteSlip() {
    favIcon.classList.add("fas");
}
function reportUnfavouriteSlip() {
    favIcon.classList.remove("fas");
}
function reportCancelFetch() {
    document.querySelector("section#controls > div > div#loader").style.animationPlayState = 'paused';
    document.querySelector("section#controls > div > span").innerHTML = "loading was cancelled";
    cancelBtn.style.visibility = "visible";
    cancelBtn.innerHTML = "reload advice";
    mainQuoteCtn.style.opacity = "1";
    mainQuote.innerHTML = currentAdviceData.slip.advice;

    fetchingStatus = "cancelled";
}
function reportErrorFetch() {
    document.querySelector("section#controls > div > div#loader").style.animationPlayState = 'paused';
    document.querySelector("section#controls > div > span").innerHTML = "Network Error: couldn't fetch advice";
    cancelBtn.style.visibility = "visible";
    cancelBtn.innerHTML = "reload advice";
    mainQuoteCtn.style.opacity = "1";
    mainQuote.innerHTML = "network error: couldn't fetch advice";

    fetchingStatus = "cancelled";
}
function reportStartFetch() {
    mainQuoteCtn.style.opacity = "0";
    
    document.querySelector("section#controls > div > div#loader").style.animationPlayState = 'running';
    document.querySelector("section#controls > div > span").innerHTML = "fetching new advice";
    cancelBtn.style.visibility = "visible";
    cancelBtn.innerHTML = "cancel";

    fetchingStatus = "loading";
}
function reportAdviceFetch() {
    mainQuoteCtn.style.opacity = "0";
    
    document.querySelector("section#controls > div > div#loader").style.animationPlayState = 'running';
    document.querySelector("section#controls > div > span").innerHTML = "fetching advice";
    cancelBtn.style.visibility = "visible";
    cancelBtn.innerHTML = "cancel";

    fetchingStatus = "loading";
}
function reportSuccessFetch() {
    mainQuoteCtn.style.opacity = "1";
    
    document.querySelector("section#controls > div > div#loader").style.animationPlayState = 'paused';
    document.querySelector("section#controls > div > span").innerHTML = "advice fetch successful";
    cancelBtn.style.visibility = "hidden";

    fetchingStatus = "successful";
}


// the displayFetchSlip()
// used to display fetched advice slip data in the program
function displayFetchedSlip( data ) {
    reportSuccessFetch();

    mainQuote.innerHTML = data.slip.advice;
    
    if ( favouritedAdvicesIds.includes( data.slip.id ) ) {
        reportFavouriteSlip();
    } else {
        reportUnfavouriteSlip();
    }

}


// the favouriteSlip() 
// used to add an advice slip to the favourite list
function favouriteSlip() {
    // adding the id to the favourite list of the advice slips
    favouritedAdvicesIds.unshift( currentAdviceData.slip.id );

    displayFavouritedSlipList();
}


// the favouriteSlip() 
// used to remove an advice slip to the favourite list
function unfavouriteSlip() {
    // getting the index of the id to remove from the favourite list of the advice slips
    var indexOfIdToRemove = favouritedAdvicesIds.indexOf( currentAdviceData.slip.id );

    // removing the id from the favourite list
    if ( indexOfIdToRemove != -1 ) {
        favouritedAdvicesIds.splice( indexOfIdToRemove, 1 );
    }

    displayFavouritedSlipList();
}


// persistently saving the favourited-advice-list into the local-storage in order to retrieve them
setInterval( () => {
    localStorage.setItem("favourite-advices-id", JSON.stringify( favouritedAdvicesIds ) );
}, 100 );


// the fetchFavouritedSlipList()
// used to asynchrously fetch all the data about the favourited advice slips
async function fetchFavouritedSlipList() {
    var favouritedSlipsFetchs = [];
    var favouritedSlipsData = [];

    try {
        for ( var id of favouritedAdvicesIds ) {
            favouritedSlipsFetchs.push(
                fetch( ADVICE_BY_ID + id, { cache: "no-store", signal: fetchController.signal } )
            );
        }
    
        var resps = await Promise.all( favouritedSlipsFetchs );
    
        for ( var resp of resps ) {
            favouritedSlipsData.push( await resp.json() );
        }

        return favouritedSlipsData;
    } catch ( error ) {
        return "error";
    }
}


// the displayFavouritedSlipList()
// used to display all the fetched data about the fetched favourited advice slips
function displayFavouritedSlipList() {
    favouriteAdviceElem.classList.add("loading");
    favouriteAdviceElem.classList.remove("error");
    favouriteAdviceElem.classList.remove("successful");

    favouriteAdviceElem.innerHTML = `
        <div id="loading-ctn">
            <div id="loader"></div>
            <span>loading favourites...</span>
        </div>

        <div id="error-ctn">
            <span class="fas fa-exclamation-triangle"></span>
            <span>error loading favourites...</span>
        </div>
    `;

    fetchFavouritedSlipList()
    .then( function( adviceSlips ) {
        if ( adviceSlips !== "error" ) {

            if ( adviceSlips == [] ) {
                favouriteAdviceElem.classList.remove("loading");
                favouriteAdviceElem.classList.remove("error");
                favouriteAdviceElem.classList.add("successful");

                favouriteAdviceElem.innerHTML = `
                    <div id="error-ctn">
                        <span class="fas fa-exclamation-triangle"></span>
                        <span>you don't have any favourites...</span>
                    </div>
                `;
            } else {
                favouriteAdviceElem.classList.remove("loading");
                favouriteAdviceElem.classList.remove("error");
                favouriteAdviceElem.classList.add("successful");


                for ( var adviceSlip of adviceSlips ) {
                    favouriteAdviceElem.innerHTML += `
                        <div class="advice" data-advice-id="${ adviceSlip.slip.id }">
                            <span class="fas fa-heart"></span>
        
                            <span>
                                ${ adviceSlip.slip.advice }
                            </span>
                        </div>
                    `;
                }
                
                
                // the adviceElem  "UI selection" logic
                // used to handle UI display logic concerned with favourite advice
                for ( var adviceElem of favouriteAdviceElem.children ) {
                    adviceElem.addEventListener( "click", function(event) {
            
                        // removing the selection from the targeted adviceElem if it's selected
                        // if not, make it selected
                        if ( event.target.classList.contains("selected") ) {
            
                            event.target.classList.remove("selected");
            
                        } else {
            
                            // removing the "selected" class from all the favouriteAdviceElem
                            // in order to avoid multiple selection error in the UI Styles
                            for ( var adviceElem of favouriteAdviceElem.children ) {
                                adviceElem.classList.remove("selected");
                            }
            
                            // making the targeted adviceElem appear as selected on the UI
                            event.target.classList.toggle("selected");

                            fetchAdviceSlipByID( event.target.getAttribute("data-advice-id") );

                            clearInterval( interval );
                            interval = setInterval( runningFetch, 6000 );
                        }
                    })
                }
            }
        } else {
            favouriteAdviceElem.classList.remove("loading");
            favouriteAdviceElem.classList.add("error");
        }
    });
}


// the fetchAdviceSlipByID()
// used to asynchrously fetch a specific advice slip by it's id
async function fetchAdviceSlipByID( id ) {
    try {
        reportAdviceFetch();

        const res = await fetch( ADVICE_BY_ID + id , { cache: "no-store" });

        if ( res.status === 200 ) {
            fetchingStatus = "successful";

            const data = await res.json();

            currentAdviceData = data;
            displayFetchedSlip(data);
        } else {
            throw new Error("FetchError");
        }
    } catch (error) {
        if (error.message === "FetchError") {
            reportErrorFetch();
            fetchingStatus = "error";
        }
    }
}
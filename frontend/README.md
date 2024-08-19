# high level
- 2 modules
 - web app interface
 - scripts to get us the data users want

# todos:
- pre-selected options
- `KeyError: 'st.session_state has no key "what_they_want". Did you forget to initialize it? More info: https://docs.streamlit.io/library/advanced-features/session-state#initialization'`

# cool ideas:
- submitting application for user
- map rendering of the apartment locations

# feedback
- give me RAGs for all of the responses
    - `fitness club` is not recognized as a `gym`
- (having pre-selected options of what matters to me / locations)
- consistent format for the callGroq_init()

# market research 1 (15 each)

## feature feedback
- (1) batch data ingestion
- PDF generation of recommendations
    - "see my top 5 apartments"
    - visually pleasing display of information
    - shows all relevant information & gives the user the feel of having done 'extremely thorough research'
    - easily shared with friends & family for the 'legit' test
    - highlight major differences between them (in other words marginal analysis)
    - good way to help our app go viral
- map interface for user
    - see quickly where all of the suggestions are in a neighborhood
- a to-do list of things you need to do while you're moving out
    - generating the necessary letters to your current landlord for security deposits
    - utilities, etc.
    - informed by the lease
- basic summarization of what is in the lease you are agreeing to
- conversation flow
    - a way to see how the typical apartment should be found
- finding me an apartment like:
    - the one I have
        - gives you a good chance to leave reviews of your current one
        - speech to text may be better than asking users to type it out
    - conversely find me one nothing like the current one
    - a search recommendation
- a sponsored section to sell moving related services
    - maids for new apartments
    - moving companies
    - renting furniture
    - virtual tour
- having a sense of the competition for an apartment is key
    - zillow's stuff is unreliable
- market data on an area to see when is the best time to shop around
    - public information about leases can be key as well as internal ones
- AI Concierge 
    - notification stream
    - watches for your criteria for 1/e of your time-frame and then helps you find the right one
    - in other words, I want this thing to be on the look out for me, and then show me stuff once it thinks it has the right things for me
    - know when the lease is up to let someone do an 'auto check the market' to see if they can find a better deal
- ways to distinguish between wants & needs
- a way to determine if your furniture will fit into the unit!

## data sources they'd like
- public transportation options + commute times
    - this also includes commute routes by private car
- reviews (both from google maps, yelp, and from building specific ones if possible)
    - summary of the starred reviews + any management response
    - emphasis on similarities of 1, 5, and 234
- market data
    - when leases are coming up in the city
    - population data on the major trends in neighborhoods
    - historical rent data on the property
    - legit demand numbers for the apartment
- apt actual
    - rent
    - lat, long
    - description
    - photos
    - parking information & public garage availability
    - how recently this was renovated (perhaps from the images attached)
    - building manufacturer
    - is this a subletting type situation
    - any pet friendly buildings + breeding restrictions
        - any experiences people had with this would be key as well (pocket veto)
    - utility approximations
    - hidden fees upfront
    - view from the unit
- neighborhood
    - **exhaustive** list of options in a neighborhood
    - neighborhoods & the opinions about them
    - (as much as legally possible the vibe of the place)
    - street noise
    - bars & restaurants for social gatherings
    - schools / daycares
- safety
    - homelessness
    - collisions on the street (bike & car)
- meta data
    - relatively fresh data (the number of false positives should be very low & we should become quickly aware of them)
    - virtual tours on demand would be excellent
    - broker fees (deal breaker for many)
- proximity to key places
    - gf
    - work / college
    - friend groups
- government data
    - 311 / public databases about the landlord (or lack of complaints)


## competitors
- google maps
- zillow
- apts.com
- apts 4 rent
- trulia
- craigslist
- street easy

# backlog:
- render images via iframe for easier browser usage
    - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#loading

# mvp:
- delta between the top 5 and the top 100 -> m
- forms looks @ neighborhoods via an arbitrary coordinate -> m
- reviews for the items in our list -> c
    - this can be at scrape time or runtime
- restaurants and bars in the area -> c
    - Matthew figures out a way to get what other people want
- walkability score into website -> m
- school score -> m
- pet friendly -> c
- google maps link for property -> c
- map rendering is key -> m
    - https://leafletjs.com/
- AWS Stack -> m
    - dynamodb for db
- sharing among friends will be key -> m

# meeting notes
- `dataCompilation()` will be done by the backend with `formData` as the inputs
    - Matthew will send Cody the API contract
    - return from the server the top (n=100) options
- eater.com as a hot spot
    - pull from restaurants
- reviews from google maps
    - scraper will be Cody
        - ideal categorized by stars
            - {1:[], 2: [], 3:[], 4:[], 5:[]}
            - round up fractional stars
    - Matthew will handle the LLM summarization

# next time
- getting user feedback without text messages
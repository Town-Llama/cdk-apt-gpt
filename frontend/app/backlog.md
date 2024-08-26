- we want to use user.sub, not email

- metrics to verify cost per token per revenue event


- suggestions box
- presentation of why we chose these
- bed & sqft needs to be in more places

# known issues items:
- login not persisting : https://community.auth0.com/t/authentication-is-lost-after-page-refresh/61030/3 >> fixed when we get a custom domain
- reloading sidebar
- porting all putItem calls to redux

- what data does it have access to?

# before saturday:
- [x] Sharing 
    - [x] in login menu
    - [x] UI adjusts if not the owner looking
        - no sharing others
        - title shows it's anothers
- neighborhoods
    - list of major Austin neighborhoods
- price floor
- AI Chat setup
- metrics

# backlog overall
- auth0 if you are on recommendations will redirect you back to the home page, not where you left off
    - history is not working then\
- enter to submit message on Chat.js

# backlog from streamlit port
- remove groq call from frontend
- corsproxy.io call from Census Bureau
- reading in the json files
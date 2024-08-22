import CloudWatchMetrics from "../AWS/CloudWatchMetrics";
import globalRequestManager from './RequestManager'; // Import the global request manager
const auth_config = require("../../../auth/auth_config.json");

class AptGptUtility {
  static BASE_URL = 'https://api.townllama.ai'; // if beta
  //static BASE_URL = 'https://api.beta.townllama.ai'; // if beta

    constructor(getAccessTokenSilently, isAuthenticated, user) {
        console.log("url:", AptGptUtility.BASE_URL);
        this.getAccessTokenSilently = getAccessTokenSilently;
        this.isAuthenticated = isAuthenticated;
        this.cloudWatchMetrics = new CloudWatchMetrics('YourAppNamespace');
        this.user = user;
    }

    async datas_previouschat(conversationid) {
      const res = await globalRequestManager.enqueueRequest(()=>  this.post("datas/previouschat", {
        conversationid, userid: this.user.email
      }));
      return res.data;
    }

    async datas_route(start, end) {
      const res = await globalRequestManager.enqueueRequest(()=>  this.post("datas/route", {
        start, end
      }));
      return res.data;
    }

    async datas_neighborhoods(city) {
      const res = await globalRequestManager.enqueueRequest(()=>  this.post("datas/neighborhoods", {city}));
      return res.data;
    }

    async datas_cities() {
      const res = await globalRequestManager.enqueueRequest(()=>  this.get("datas/cities"));
      return res.data;
    }

    async datas_search(form_data) {
      const res = await globalRequestManager.enqueueRequest(()=> this.post("datas/search", {...form_data, user: this.user.email}));
      return res.data;
    }

    async datas_waitlist() {
      const res = await globalRequestManager.enqueueRequest(()=>  this.post("datas/waitlist", {
        userid: this.user.email
      }));
      return res.authenticated;
    }

    async datas_waitlist_record(phone) {
      const res = await globalRequestManager.enqueueRequest(()=>  this.post("datas/waitlist/record", {
        userid: this.user.email,
        recommendeduser: phone
      }));
      return res.authenticated;
    }

    async datas_chats() {
      const res = await globalRequestManager.enqueueRequest(()=>  this.post("datas/chats", {
        userid: this.user.email
      }));
      return res.data;
    }

    async datas_chats_record(ask, conversationid, commuteaddress, poiArr, poiData, chatState, aptIdArr){
      const res = await globalRequestManager.enqueueRequest(()=> this.post("datas/chats/record", {
        user: this.user.email, ask, conversationid, commuteaddress, poiArr, poiData, chatState, aptIdArr
      }))
      return res.data
    }

    async chat_reviews(apt){
      const res = await globalRequestManager.enqueueRequest(()=> this.post("chat/reviews", {
        apt, user: this.user.email
      }));
      return res.data;
    }

    async chat_pois(msg) {
      const res = await globalRequestManager.enqueueRequest(()=>  this.post("chat/pois", {
        msg
      }));
      return res.data;
    }

    async chat_next(msgs, conversation_id) {
        const res = await globalRequestManager.enqueueRequest(()=>  this.post("chat/next", {
            msgs, conversation_id, user_id: this.user.email
        }));
        return res;
    }

    async chat_suggestion(rec, formdata) {
        const res = await globalRequestManager.enqueueRequest(()=> this.post("chat/suggestion", {
            rec, formdata
        }));
        return res.data;
    }

    async chat_suggestion_short(rec, formdata) {
      const res = await globalRequestManager.enqueueRequest(() => this.post("chat/suggestion/short", { rec, formdata }));
      return res.data;
  }

    async datas_book (ask, conversationid, aptId) {
      const res = await this.post("datas/book", {
        userid: this.user.email, ask, conversationid, aptId
      });
      return res.data;
    }

    async get(endpoint) {
        const accessToken = await this.fetchAccessToken(); // Fetch access token
    
        if (!accessToken) {
          console.warn('User is not authenticated. Exiting request early.');
          return null;
        }
    
        const headers = {};
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`; // Include authorization token
        }
    
        const url = `${AptGptUtility.BASE_URL}/${endpoint}`; // Construct the full URL
        try {
          const response = await fetch(url, {
            headers,
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        } catch (error) {
          this.cloudWatchMetrics.emitErrorMetric('AptGptUtility', 'get/'+endpoint);
          await this.cloudWatchMetrics.writeLog(
              "Error in AptGptUtility.get/"+endpoint+" user {"+JSON.stringify(this.user)+
              "}");
          throw error;
        }
      }
    
      async post(endpoint, data, ) {
        const accessToken = await this.fetchAccessToken(); // Fetch access token
    
        if (!accessToken) {
          console.warn('User is not authenticated. Exiting request early.');
          return null;
        }
    
        const headers = {
          'Content-Type': 'application/json',
        };
    
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`; // Include authorization token
        }
    
        const url = `${AptGptUtility.BASE_URL}/${endpoint}`; // Construct the full URL
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            console.log(response);
            throw new Error('Network response was not ok');
          }
          return response.json();
        } catch (error) {
          this.cloudWatchMetrics.emitErrorMetric('AptGptUtility', 'post/'+endpoint);
          await this.cloudWatchMetrics.writeLog(
              "Error in AptGptUtility.post/"+endpoint+" user {"+JSON.stringify(this.user)+
              "} with data {"+JSON.stringify(data)+"}");
          throw error;
        }
      }

      async fetchAccessToken() {
    
        if (!this.isAuthenticated) {
          console.warn('User is not authenticated. Cannot fetch access token.');
          return null;
        }
    
        try {
          const accessToken = await this.getAccessTokenSilently({
            audience: `https://${auth_config.domain}/api/v2/`, // Replace with your API identifier
            scope: 'read:current_user',
          });
          return accessToken;
        } catch (error) {
          console.error('Error fetching access token:', error);
          this.cloudWatchMetrics.emitErrorMetric('AptGptUtility', 'fetchAccessToken');
          await this.cloudWatchMetrics.writeLog(
              "Error in AptGptUtility.fetchAccessToken user {"+JSON.stringify(this.user)+
              "}");
          throw error;
        }
      }
  }
  
  export default AptGptUtility;
  
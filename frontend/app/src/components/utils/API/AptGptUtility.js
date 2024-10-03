import CloudWatchMetrics from "../AWS/CloudWatchMetrics";
import globalRequestManager from "./RequestManager"; // Import the global request manager
const auth_config = require("../../../auth/auth_config.json");

class AptGptUtility {
  static BASE_URL = "";

  constructor(getAccessTokenSilently = null, isAuthenticated = false, user = null) {
    this.getAccessTokenSilently = getAccessTokenSilently;
    this.isAuthenticated = isAuthenticated;
    this.cloudWatchMetrics = new CloudWatchMetrics("TownLlama");
    this.user = user;
  }

  drop_all_previous_requests() {
    globalRequestManager.dropQueue();
  }

  async blog_entry(id) {
    const res = await this.get_unauthorized("api/blog/posts/" + id);
    console.log(res, "res");
    return res.data[0];
  }

  async blog_all() {
    const res = await this.post_unauthorized("api/blog/all", {});
    console.log(res, "res");
    return res.data;
  }

  async datas_modelOne() {
    const res = await this.post("api/modelOne", {
      'load_model': true,
    });
    return res;
  }

  async datas_modelTwo() {
    const res = await this.post("api/modelTwo", {
      'load_model': true,
    });
    return res;
  }

  async datas_fetch_apt(apt_id) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post_unauthorized(`api/fetch_apt/${apt_id}`)
    );
    console.log(res, "res");
    return res.data;
  }

  async datas_previouschat(conversationid) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/previouschat", {
        conversationid,
        userid: this.user.email,
      })
    );
    return res.data;
  }

  async datas_route(start, end) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/route", {
        start,
        end,
      })
    );
    return res.data;
  }

  async datas_neighborhoods(city) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/neighborhoods", { city })
    );
    return res.data;
  }

  async datas_cities() {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.get("api/cities")
    );
    return res.data;
  }

  async datas_search(form_data) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/search", { ...form_data, user: this.user.email })
    );
    return res.data;
  }

  async datas_waitlist() {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/waitlist", {
        userid: this.user.email,
      })
    );
    return res.authenticated;
  }

  async datas_chats() {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/chats", {
        userid: this.user.email,
      })
    );
    return res.data || [];
  }

  async datas_chats_record(
    ask,
    conversationid,
    commuteaddress,
    poiArr,
    poiData,
    chatState,
    aptIdArr
  ) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/chat/record", {
        user: this.user.email,
        ask,
        conversationid,
        commuteaddress,
        poiArr,
        poiData,
        chatState,
        aptIdArr,
      })
    );
    return res.data;
  }

  async chat_reviews(apt) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/chat/reviews", {
        apt,
        user: this.user.email,
      })
    );
    return res.data;
  }

  async chat_pois(msg) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/chat/pois", {
        msg,
      })
    );
    return res.data;
  }

  async chat_next(msgs, conversation_id) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/chat/next", {
        msgs,
        conversation_id,
        user_id: this.user.email,
      })
    );
    return res;
  }

  async chat_suggestion(rec, formdata) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/chat/suggestion", {
        rec,
        formdata,
      })
    );
    return res.data;
  }

  async chat_suggestion_short(rec, formdata) {
    const res = await globalRequestManager.enqueueRequest(() =>
      this.post("api/short", { rec, formdata })
    );
    return res.data;
  }

  async datas_book(ask, conversationid, aptId) {
    const res = await this.post("api/book", {
      userid: this.user.email,
      ask,
      conversationid,
      aptId,
    });
    return res.data;
  }

  async get_unauthorized(endpoint) {

    const headers = {
      "Content-Type": "application/json",
    };

    const url = `${AptGptUtility.BASE_URL}/${endpoint}`; // Construct the full URL
    try {
      const response = await fetch(url, {
        headers,
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    } catch (error) {
      await this.cloudWatchMetrics.emitErrorMetric(
        "AptGptUtility",
        "get/" + endpoint
      );
      await this.cloudWatchMetrics.writeLog(
        "Error in AptGptUtility.get/" +
        endpoint +
        " user {" +
        JSON.stringify(this.user) +
        "}"
      );
      throw error;
    }
  }

  async get(endpoint) {
    const accessToken = await this.fetchAccessToken(); // Fetch access token
    console.log("HIT");

    if (!accessToken) {
      console.log("User is not authenticated. Exiting request early.");
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
        throw new Error("Network response was not ok");
      }
      return response.json();
    } catch (error) {
      await this.cloudWatchMetrics.emitErrorMetric(
        "AptGptUtility",
        "get/" + endpoint
      );
      await this.cloudWatchMetrics.writeLog(
        "Error in AptGptUtility.get/" +
        endpoint +
        " user {" +
        JSON.stringify(this.user) +
        "}"
      );
      throw error;
    }
  }

  async post_unauthorized(endpoint, data) {

    const headers = {
      "Content-Type": "application/json",
    };

    const url = `${AptGptUtility.BASE_URL}/${endpoint}`; // Construct the full URL
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    } catch (error) {
      await this.cloudWatchMetrics.emitErrorMetric(
        "AptGptUtility",
        "post/" + endpoint
      );
      await this.cloudWatchMetrics.writeLog(
        "Error in AptGptUtility.post/" +
        endpoint +
        " user {" +
        JSON.stringify(this.user) +
        "} with data {" +
        JSON.stringify(data) +
        "}"
      );
      throw error;
    }
  }

  async post(endpoint, data) {
    const accessToken = await this.fetchAccessToken(); // Fetch access token

    if (!accessToken) {
      console.warn("User is not authenticated. Exiting request early.");
      return null;
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`; // Include authorization token
    }

    const url = `${AptGptUtility.BASE_URL}/${endpoint}`; // Construct the full URL
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    } catch (error) {
      await this.cloudWatchMetrics.emitErrorMetric(
        "AptGptUtility",
        "post/" + endpoint
      );
      await this.cloudWatchMetrics.writeLog(
        "Error in AptGptUtility.post/" +
        endpoint +
        " user {" +
        JSON.stringify(this.user) +
        "} with data {" +
        JSON.stringify(data) +
        "}"
      );
      throw error;
    }
  }

  async fetchAccessToken() {
    if (!this.isAuthenticated) {
      console.warn("User is not authenticated. Cannot fetch access token.");
      return null;
    }

    try {
      const accessToken = await this.getAccessTokenSilently({
        audience: `https://${auth_config.domain}/api/v2/`, // Replace with your API identifier
        scope: "read:current_user",
      });
      return accessToken;
    } catch (error) {
      console.error("Error fetching access token:", error);
      await this.cloudWatchMetrics.emitErrorMetric(
        "AptGptUtility",
        "fetchAccessToken"
      );
      await this.cloudWatchMetrics.writeLog(
        "Error in AptGptUtility.fetchAccessToken user {" +
        JSON.stringify(this.user) +
        "}"
      );
      throw error;
    }
  }
}

export default AptGptUtility;

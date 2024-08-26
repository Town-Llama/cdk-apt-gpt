class RequestManager {
    constructor() {
      this.requestQueue = [];
      this.isProcessingQueue = false;
      this.REQUEST_DELAY = 10; // Adjust delay as needed
    }
  
    enqueueRequest(requestFn) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ requestFn, resolve, reject });
        this.processQueue();
      });
    }

    dropQueue() {
      this.requestQueue = [];
    }
  
    async processQueue() {
      if (this.isProcessingQueue || this.requestQueue.length === 0) {
        return;
      }
  
      this.isProcessingQueue = true;
      const { requestFn, resolve, reject } = this.requestQueue.shift();
  
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        setTimeout(() => {
          this.isProcessingQueue = false;
          this.processQueue();
        }, this.REQUEST_DELAY);
      }
    }
  }
  
  // Create a single instance of the RequestManager
  const globalRequestManager = new RequestManager();
  
  export default globalRequestManager;
  
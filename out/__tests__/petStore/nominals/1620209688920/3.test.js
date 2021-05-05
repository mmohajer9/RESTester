const JSONConfig = require('./config.json');
const instance = require('./axiosInstance');

test("test case generated by RESTester - 1620209688920", async () => {
    try {
        
            
            // request which is going to be sent in the test case
            instance.post('/pet/{petId}' , {...JSONConfig.requestBody} , {
              params : {...JSONConfig.queryParams},
              headers : {...JSONConfig.headers}
            }).then(res => {
              console.log(res);
            }).catch(console.error)
            
            
             
    } catch (e) {
        expect(e).toMatch('error');
    }
});
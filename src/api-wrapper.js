const BASE_URL = 'https://api.pitneybowes.com';

function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

export class ApiWrapper {
    constructor() {
        this.token = '';
        this.urls = {
            'geocode': 'location-intelligence/geocode-service/v1/transient/premium/geocode',
            'pbkey': 'location-intelligence/geocode-service/v1/key/byaddress',
            'crime': 'location-intelligence/georisk/v1/crime/byaddress',
            'earthquake': 'location-intelligence/georisk/v1/earthquake/byaddress',
            'flood': 'location-intelligence/georisk/v1/flood/byaddress',
            'fire': 'location-intelligence/georisk/v1/fire/byaddress',
            'distanceToFlood': 'location-intelligence/georisk/v1/shoreline/distancetofloodhazard/byaddress',
            'demographics': 'location-intelligence/geolife/v2/demographics/byaddress',
            'segmentation': 'location-intelligence/geolife/v1/segmentation/byaddress'
        }
    }

    /**
     * 
     * @param {string} address The address to get results for.
     * @param {string} country The ISO country code to get results for.
     * @param {Array} apiList The list of APIs to call, default is all. EX: ['geocode', 'pbkey', 'crime', 'earthquake', 'flood', 'fire', 'distanceToFlood', 'demographics', 'segmentation']
     */
    getResults(address, country = 'USA', apiList = ['geocode', 'pbkey', 'crime', 'earthquake', 'flood', 'fire', 'distanceToFlood', 'demographics', 'segmentation']) {
        return new Promise(resolve => {
            const promises = [];

            // make each API call
            apiList.forEach(api => {
                promises.push(this.executeCall(api, address, country));
            });

            Promise.all(promises).then(results => {
                const result = { };

                results.forEach((value, index) => result[apiList[index]] = value);

                // format the geocode result
                if (result.geocode && result.geocode.candidates && result.geocode.candidates.length > 0) {
                    result.geocode = result.geocode.candidates[0];
                }

                resolve(result);
            });
        });
    }

    /**
     * Gets the authentication token which is used by all of the API calls.
     * @param {string} clientId 
     * @param {string} sharedSecret 
     */
    getAuthToken(clientId, sharedSecret) {
        return new Promise((resolve, reject) => {
            let encodedToken = b64EncodeUnicode(`${clientId}:${sharedSecret}`);

            fetch(`${BASE_URL}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${encodedToken}`
                },
                body: 'grant_type=client_credentials'
            }).then(response => response.json().then(json => {
                this.token = json;
                resolve();
            }));
        });
    }

    executeCall(api, address, country) {
        console.log(api);

        return new Promise((resolve, reject) => {
            const url = this.urls[api];
            let params = `address=${encodeURI(address)},+${country}`;

            if (api === 'geocode') {
                params = `mainAddress=${encodeURI(address)}&country=${country}`;
            }

            fetch(`${BASE_URL}/${url}?${params}`, {
                methid: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token.access_token}`
                }
            }).then(response => response.json().then(json => {
                console.log(json);
                resolve(json);
            }));
        });
    }
}
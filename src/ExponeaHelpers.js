var ExponeaHelpers = {
    getCookie: function(){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
        });
    },
    getSource: function(){
        var sources = ['google.com', 'facebook.com', 'instagram.com'];
        return sources[Math.floor(Math.random() * sources.length)]
    },
    getBrowser: function(){
        var browsers = ['Chrome', 'Firefox', 'Edge'];
        return browsers[Math.floor(Math.random() * browsers.length)]
    },
    getOs: function(){
        var oss = ['Windows', 'Android', 'Linux'];
        return oss[Math.floor(Math.random() * oss.length)]
    },
    getDevice: function(){
        var devices = ['Other', 'Mobile',];
        return devices[Math.floor(Math.random() * devices.length)]
    },

    getUserDevice: function(){
        return {
            ids: {
                cookie: this.getCookie(),
            },
            browser: this.getBrowser(),
            os: this.getOs(),
            device: this.getDevice()
        }
    }
}

module.exports = ExponeaHelpers;
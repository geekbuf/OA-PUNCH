/**
 * 1. 登录 access_token、base_user_id
 * 2. 获取初始化信息 sysid、corpid
 * 3. 获取生成Cookie地址 tourl
 * 4. 获取cookie Set-Cookie
 * 5. 对cookie进行鉴权测试（少了这部无法继续下一步）
 * 5. 获取列表信息 
 * 6. 根据需求进行操作
 */
let request = require('request')
let UUID = require('uuid')
const {
    userInfo
} = require('os')

var domain = '119.3.147.83'
var port = '8999'
var userName = 'guxs'
var pwd = 'abc123'
var genUUID = UUID.v1();

securityUrl = `http://${domain}:${port}/emp/passport/securitysetting/get?&loginUUID=${genUUID}`;
loginUrl = `http://${domain}:${port}/emp/passport/login`
initInfoUrl = `http://${domain}:${port}/emp/api/passport/getinit?client_type=3`
authUrl = `http://${domain}:${port}/emp/api/agent/client/link/home?agentid=1&em_client_type=3`
testUrl = `http://${domain}/api/ec/dev/app/test?`
locationUrl = `http://${domain}/api/hrm/kq/grouplocation/getLocationWifiInfo`
puchButtonUrl = `http://${domain}/api/hrm/kq/attendanceButton/punchButton`

/** 登录获取Cookie地址所需Header参数*/
function getHeadParams(access_token) {
    var headCookieUrlData = {
        access_token: access_token,
        emaccesstk: access_token
    }
    return headCookieUrlData;
}

/**
 * 
 * @param {String} corpid 企业产品ID
 */
function getAuthUrl(corpid) {
    corpid = corpid;
    return authUrl + `&corpid=${corpid}`;
}

/**
 * 获取校验Cookie正确性地址
 * @param {int} uid 用户ID
 * @param {int} sysid 系统ID
 * @param {string} auth_code 授权码
 */
function getTestCookieUrl(uid, sysid, auth_code) {
    em_auth_userid = uid;
    outsysid = sysid;
    em_client_type = 'mobile';
    em_auth_code = auth_code;
    return testUrl + `em_auth_userid=${uid}&outsysid=${outsysid}&em_client_type=${em_client_type}&em_auth_code=${em_auth_code}`;
}

/**
 * 获取GET请求地址里后面参数值
 * @param {String} url 请求地址
 * @param {String} variable 字段名
 */
function getQueryVariable(url, variable) {
    var query = url;
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
}

/**
 * 
 * @param {String} url 请求地址
 * @param {Object} headers 携带头部信息对象
 * @param {Object} reqData 携带请求体信息对象
 */
function getUrlByParams(url, headers = {}) {
    return new Promise((resolve, reject) => {
        request({
            timeout: 5000, // 设置超时
            method: 'GET', //请求方式
            url: url,
            headers: headers
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // console.log(response.headers['set-cookie'][0])
                // console.log(body);
                var html = {
                    headers: response.headers,
                    body: body
                }
                resolve(html);
            } else {
                reject(null);
            }
        });
    }).catch(error => console.log('异常提示', error));
}

/**
 * 
 * @param {String} url 请求地址
 * @param {Object} headers 携带header头对象
 * @param {Object} reqData 携带请求体对象
 */
function postUrlByParams(url, headers, reqData) {
    return new Promise((resolve, reject) => {
        request({
            url: url,
            method: "POST",
            json: true,
            gzip: true, //解压缩
            headers: headers,
            body: reqData
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var html = {
                    header: response.headers,
                    body: body
                }
                if (body != "") {
                    resolve(html);
                } else {
                    reject(null);
                }

            } else {
                console.log("请求出错！");
                reject(null);
            }
        });
    }).catch(error => console.log('错误提示', error));
}


function postWithoutBody(url, headers) {
    return new Promise((resolve, reject) => {
        request({
            url: url,
            method: "POST",
            gzip: true, //解压缩
            headers: headers
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var html = {
                    header: response.headers,
                    body: body
                }
                if (body != "") {
                    resolve(html);
                } else {
                    reject(null);
                }

            } else {
                console.log("请求出错！");
                reject(null);
            }
        });
    }).catch(error => console.log('错误提示', error));
}

/*登录参数*/
loginData = {
    "loginUUID": genUUID,
    "password": pwd,
    "device_name": "M78星云-光之国",
    "loginid": userName,
    "device_id": "a9ec035dad4bc285",
    "login_type": "1",
    "os_version": "29",
    "client_model": "MI 9",
    "lang_type": "zh",
    "client_type": "3",
    "client_version": "7.0.37.20200806"
}

async function getLocationList() {
    var userInfo = {
        user_id: '',
        access_token: '',
        sysid: '',
        corpid: '',
        auth_url: '',
        auth_code: '',
        tourl: '',
        cookie: ''
    }

    var token_header = {
        access_token: '',
        emaccesstk: ''
    }

    //登录
    const loginResult = await postUrlByParams(loginUrl, {}, loginData);
    if (loginResult != null) {
        userInfo.access_token = loginResult.body['access_token'];
        userInfo.user_id = loginResult.body['base_user_id'];
        token_header.access_token = userInfo.access_token;
        token_header.emaccesstk = userInfo.access_token;
        console.log("1.登录完毕!");
    } else {
        console.info("1.登录失败，流程中止！");
        return;
    }

    //初始化信息
    const initResult = await getUrlByParams(initInfoUrl, token_header);
    if (initResult != null) {
        var initObj = JSON.parse(initResult.body);
        userInfo.sysid = initObj.sys_info[0]['sysid'];
        userInfo.corpid = initObj.join_info.tenantlist[0].corpid;
        console.log("2.初始化信息完毕!");
    } else {
        console.info("2.初始化信息失败，流程中止！");
        return;
    }

    //获取得到Cookie的链接
    const authCookieUrl = getAuthUrl(userInfo.corpid);
    const cookieResult = await getUrlByParams(authCookieUrl, token_header);
    if (cookieResult != null) {
        var cookieObj = JSON.parse(cookieResult.body);
        userInfo.auth_url = cookieObj.tourl;
        userInfo.auth_code = await getQueryVariable(userInfo.auth_url, "em_auth_code");
        console.log("3.获取cookie链接完毕!");
    } else {
        console.info("3.得到链接失败，流程中止！");
        return;
    }

    //获取Cookies
    const realCookieResult = await getUrlByParams(userInfo.auth_url, token_header);
    if (realCookieResult != null) {
        const realCookie = realCookieResult.headers['set-cookie'];
        userInfo.cookie = realCookie[0];
        console.log("4.获取cookie成功!");
    } else {
        console.info("4.获取COOKIE失败，流程中止！");
        return;
    }

    const locationCookie = {
        Cookie: userInfo.cookie
    }

    //对cookie进行鉴权测试
    const testCookieUrl = getTestCookieUrl(userInfo.user_id, userInfo.sysid, userInfo.auth_code);
    const testCookieResult = await getUrlByParams(testCookieUrl, {Cookie: userInfo.cookie});
    if (testCookieResult != null) {
        const testObj = JSON.parse(testCookieResult.body);
        if (testObj.msg == "ok") {
            console.log("5.测试cookie成功!");
        } else {
            console.log("5.测试COOKIE失败，流程中止！");
        }
    } else {
        console.info("5.测试COOKIE失败，流程中止！");
        return;
    }


    //获取地址列表信息
    const locationResult = await postWithoutBody(locationUrl, locationCookie);
    if (locationResult != null) {
        const locationObj = JSON.parse(locationResult.body);
        if (locationObj != null) {
            console.log(locationObj.locationInfo.locations);
            console.log(userInfo.cookie);
            console.log("6.获取地址列表成功！");
        } else {
            console.log("6.获取地址列表信息失败，流程中止！");
            return;
        }

    } else {
        console.log("6.获取地址列表信息失败，流程中止！");
        return;
    }

}

// getUrlByParams(cornerUrl).then(function (result) {
// postUrlByParams(locationUrl, {}, result).then(function(resp){
//         console.log(JSON.stringify(resp));
//     });
// console.log(result);
// });

getLocationList();
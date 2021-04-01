/*
软件名称:番茄看看 微信扫描二维码打开
更新时间：2021-02-24 @肥皂
脚本说明：番茄看看自动阅读
脚本为自动完成番茄看看的阅读任务
每日收益1.7元左右，可多号撸。提现秒到

任务打开二维码地址 https://raw.githubusercontent.com/age174/-/main/3F545C70-389B-4155-ACB1-15B6FDA95501.jpeg

可以去boxjs修改自动提现金额和循环次数
最低提现额度为0.3元，默认提现1元
最多任务次数为100次，默认为25次运行一回

本脚本以学习为主！
首次运行脚本，会提示获取数据
去番茄看看，点击阅读A任务，开始阅读，
完成一次阅读即可获取数据。

TG电报群: https://t.me/hahaha8028

我的邀请码 : 3950781  感谢大佬们填写


注意:如果重定向跳转失败或者跑脚本没有key没有提交成功，请手动去做一个阅读A任务再执行脚本。

2.24更新 运行日志加入boxjs设置的循环次数和提现金额，key提交因为有很多302重定向，如跑脚本没有金币请查看日志的重定向是否错误
已修改循环方式，方式循环方式为一直阅读，直到当前无任务可做自动停止

boxjs地址 :  

https://raw.githubusercontent.com/age174/-/main/feizao.box.json


番茄看看
圈X配置如下，其他软件自行测试
[task_local]
#番茄看看
15 12,14,16,20 * * * https://raw.githubusercontent.com/age174/-/main/fqkk.js, tag=番茄看看, img-url=https://ftp.bmp.ovh/imgs/2021/02/f8306006536eb49c.jpeg, enabled=true


[rewrite_local]
#番茄看看
^http://m.*.top/reada/getTask url script-request-header https://raw.githubusercontent.com/age174/-/main/fqkk.js



#loon
^http://m.*.top/reada/getTask script-path=https://raw.githubusercontent.com/age174/-/main/fqkk.js, requires-header=true, timeout=10, tag=番茄看看



#surge

番茄看看 = type=http-request,pattern=^http://m.*.top/reada/getTask,requires-header=1,max-size=0,script-path=https://raw.githubusercontent.com/age174/-/main/fqkk.js,script-update-interval=0




[MITM]
hostname = m.*.top


*/


const $ = new Env('番茄看看');
const fqkkurlArr = [], fqkkhdArr = []
let fqkk = $.getjson('fqkk', [])
let needNotice = $.getval('fqkkNotice') == 'true'
let fqkkBanfirstTask = $.getval('fqkkBanfirstTask') == 'true' // 禁止脚本执行首个任务，避免每日脚本跑首次任务导致微信限制
let fqtx = ($.getval('fqtx') || '100');  // 此处修改最低提现金额，0.3元等于30，默认为提现一元，也就是100；当账上金额大于等于此配置值时，可以将账上的金额进行全部提现
let concurrency = ($.getval('fqkkConcurrency') || '1') - 0; // 并发执行任务的账号数，默单账号循环执行
concurrency = concurrency < 1 ? 1 : concurrency;

const moveData = 0 // 是否迁移旧数据，0-不迁移、1-迁移

!(async () => {
  if (typeof $request !== "undefined") {
    await fqkkck()
  } else if (moveData) {
    await fqkkckMove()
  } else {
    let execAcList = getExecAcList()
    let msgInfo = []
    for (let arr of execAcList) {
      let allAc = arr.map(ac => ac.no).join(', ')
      $.log(`\n=======================================\n开始【${$.name}账号：${allAc}】`)
      let rtList = await Promise.all(arr.map((ac, i) => execTask(ac, i)))
      msgInfo.push(rtList.map(ac => `【账号${ac.no}】\n\t当前余额：${ac.gold<0?'获取失败':ac.gold}币\n\t今日奖励：${ac.score}\n\t已阅读数：${ac.num}\n\t待阅读数：${ac.rest}${ac.extMsg?'\n\t'+ac.extMsg:''}`).join('\n\n'))
    }
    if (msgInfo.length <= 0) {
      msgInfo.push(`暂无账号数据，请重新扫码进入云扫码首页抓取数据或通过boxjs迁移之前抓取的账号数据`)
    }
    if (needNotice) {
      $.msg($.name, '', msgInfo.join('\n\n'))
    } else {
      $.log('\n======== [脚本运行完毕,打印日志结果] ========\n' + msgInfo.join('\n\n'))
    }
  }
})()
.catch((e) => $.logErr(e))
  .finally(() => $.done());

function execTask(ac, i) {
  return new Promise(async resolve => {
    try {
      await $.wait(i * 50)
      let msg = await fqkk3(ac, '');
      let finishTaskTx = false
      if (ac.rest) {
        if (ac.rest <= 0 || (fqkkBanfirstTask && ac.num <= 0)) {
          $.log(`😓账号${ac.no}今日已读${ac.num}次，本阶段待读${ac.rest}次，跳过阅读`);
        } else {
          $.log(`😄账号${ac.no}今日已读${ac.num}次，本阶段待读${ac.rest}次，即将阅读`);
          await $.wait((i + 1) * 600)
          let flag = 0;
          let count = 1;
          let allowErrorCount = 3;
          do {
            let [f, m] = await fqkk1(ac, count++);
            flag = f;
            msg = m;
            if (flag > 0) {
              $.log(`🌝账号${ac.no}在本阶段还有${ac.rest}次阅读待执行，立即阅读\n`);
            } else if (flag < 0) {
              allowErrorCount--;
            } else {
              $.log(`🌝账号${ac.no}在本阶段待阅读任务已完成：\n${msg}`);
            }
          } while (flag && allowErrorCount > 0);
          if (ac.num >= 130 && ac.rest <= 0) {
            finishTaskTx = true
          }
        }
      } else {
        $.log(`😓账号${ac.no}今日已读${ac.num}次，本阶段待读${ac.rest}次，${msg}`);
      }
      let host = ac.url.match(/^https?:\/\/(.+?)\//)[1];
      let ck = ac.headers['Cookie'] || ac.headers['cookie'];
      let ua = ac.headers['User-Agent'] || ac.headers['user-agent']
      let [, gold] = await userInfo(host, ck, ua);
      ac.gold = gold;
      if (ac.uid && ac.gold >= 30 && (ac.gold >= fqtx || finishTaskTx)) {
        ac.extMsg = await fqkktx(ac);
      }
    } catch (e) {
      $.logErr(`账号${ac.no} 循环执行任务出现异常: ${e}`);
    } finally {
      resolve(ac);
    }
  })
}

function getExecAcList() {
  let acList = fqkk.filter(o => o.hd).map((o, i) => ({no: i+1, uid: o.uid, gold: 0, score: 0, rest: 0, num: 0, url: o.url, headers: JSON.parse(o.hd.replace(/(Hm_lpvt_.+?=)\d+/, `$1${Math.floor(new Date().getTime()/1000)}`))}))
  let execAcList = []
  let len = acList.length
  // 计算分组后每组账号个数
  let slot = len % concurrency == 0 ? len / concurrency : parseInt(len / concurrency) + 1
  slot = Math.ceil(len / (slot || 1))
  let idx = -1
  acList.forEach((o, i) => {
    if (i % slot == 0) {
      idx++
    }
    if (execAcList[idx]) {
      execAcList[idx].push(o)
    } else {
      execAcList[idx] = [o]
    }
  })
  $.log(`番茄看看当前设置的最低提现金额为: ${fqtx / 100} 元`, `----------- 共${len}个账号分${execAcList.length}组去执行 -----------`)
  return execAcList
}

//番茄看看数据获取
async function fqkkck() {
  if ($request.url.indexOf("/finishTask") > -1 || $request.url.indexOf("/getTask") > -1) {
    const fqkkurl = $request.url
    const hd = {...$request.headers}
    let host = fqkkurl.match(/^https?:\/\/(.+?)\//)[1]
    let ck = hd['Cookie'] || hd['cookie']
    let ua = hd['User-Agent'] || hd['user-agent']
    let [userId, gold] = await userInfo(host, ck, ua)
    if (userId) {
      // 获取到用户ID，记录
      let status = 1
      let no = fqkk.length
      for (let i = 0, len = no; i < len; i++) {
        let ac = fqkk[i] || {}
        if (ac.uid) {
          if (ac.uid == userId) {
            no = i
            status = 0
            break
          }
        } else if (no == len) {
          no = i
        }
      }
      delete hd['Content-Type']
      delete hd['Content-Length']
      const fqkkhd = JSON.stringify(hd)
      fqkk[no] = {uid: userId, url: fqkkurl.replace('finishTask', 'getTask'), hd: fqkkhd}
      $.setdata(JSON.stringify(fqkk, null, 2), 'fqkk')
      $.msg($.name, "", `番茄看看[账号${no+1}] ${status?'新增':'更新'}数据成功！`)
    } else {
      // 未获取到用户ID，提示
      $.msg($.name, "", '番茄看看用户ID获取失败⚠️')
    }
  }
}

function userInfo(host, ck, ua) {
  return new Promise((resolve) => {
    let opts = {
      url: `http://${host}/user/`,
      headers: {
        'User-Agent': ua,
        Cookie: ck
      }
    }
    $.get(opts, async (err, resp, data) => {
      let userId = 0;
      let gold = -1;
      try {
        if (err) {
          $.logErr(`❌ 账号${ac.no} API请求失败，请检查网络后重试\n url: ${opts.url} \n data: ${JSON.stringify(err, null, 2)}`)
        } else {
          userId = (data.match(/\[用户ID:(\d+?)\]/) || ['', '0'])[1] - 0;
          if (userId) {
            gold = (data.match(/余额.+?([\d\.]+?)币/) || ['', '0'])[1] - 0;
          }
        }
      } catch (e) {
        $.logErr(`======== 账号 ${ac.no} ========\nurl: ${opts.url}\nerror:${e}\ndata: ${resp && resp.body}`)
      } finally {
        resolve([userId, gold])
      }
    })
  })
}


async function fqkkckMove() {
  let fqkkcount = ($.getval('fqkkcount') || '1') - 0;
  for (let i = 1; i <= fqkkcount; i++) {
    fqkkurlArr.push($.getdata(`fqkkurl${i>1?i:''}`))
    fqkkhdArr.push($.getdata(`fqkkhd${i>1?i:''}`))
  }
  if (fqkkhdArr.length > 0) {
    let existsId = fqkk.map(o => o.uid - 0);
    for (let i = 0, len = fqkkhdArr.length; i < len; i++) {
      fqkkurl = fqkkurlArr[i];
      fqkkhd = fqkkhdArr[i];
      if (!fqkkurl || !fqkkhd) {
        continue;
      }
      let host = fqkkurl.match(/^https?:\/\/(.+?)\//)[1];
      let hd = JSON.parse(fqkkhd);
      let ck = hd['Cookie'] || hd['cookie']
      let ua = hd['User-Agent'] || hd['user-agent']
      let [userId, gold] = await userInfo(host, ck, ua);
      if (userId && !existsId.includes(userId)) {
        fqkk.push({
          uid: userId,
          url: fqkkurl,
          hd: fqkkhd
        });
        existsId.push(userId);
      }
    }
    $.setdata(JSON.stringify(fqkk, null, 2), 'fqkk');
    $.msg($.name, "", `番茄看看数据迁移后共${fqkk.length}个账号！`);
  } else {
    $.log('无待迁移的旧数据')
  }
}

//番茄看看领取
function fqkk3(ac, fqkey) {
  return new Promise(resolve => {
    let opts = {
      url: ac.url.replace('getTask', 'finishTask'),
      headers: ac.headers,
      body: `readLastKey=${fqkey||''}`,
    }
    $.post(opts, (err, resp, data) => {
      let msg = '未知问题';
      try {
        if (err) {
          $.logErr(`❌ 账号${ac.no} API请求失败，请检查网络后重试\n url: ${opts.url} \n data: ${JSON.stringify(err, null, 2)}`);
        } else {
          const result = JSON.parse(data);
          let info = (result.data && result.data.infoView) || {rest: 0, num: 0, score: 0, msg: result.msg}
          ac.rest = (info.rest || 0) - 0;
          ac.num = (info.num || 0) - 0;
          ac.score = (info.score || 0) - 0;
          msg = info.msg || data;
          if (fqkey) {
            if (result.code == 0) {
              $.log(`🌝账号${ac.no}：${result.msg}`, `今日阅读次数: ${info.num}, 今日阅读奖励: ${info.score}`);
            } else {
              ac.rest = -1;
              $.logErr(`🚫账号${ac.no}：${result.code}|${result.msg}\n今日阅读次数: ${info.num}, 今日阅读奖励: ${info.score}`);
            }
          }
        }
      } catch (e) {
        $.logErr(`======== 账号 ${ac.no} ========\nurl: ${opts.url}\nerror:${e}\ndata: ${resp && resp.body}`)
      } finally {
        resolve(msg)
      }
    })
  })
}

function fqkk2(ac, jumpLink, flag = 0) {
  return new Promise((resolve) => {
    let opts = {url: jumpLink}
    if (flag) {
      opts['headers'] = ac.headers
    }
    $.get(opts, async (err, resp, data) => {
      let rtObj = '';
      try {
        if (err) {
          $.logErr(`❌ 账号${ac.no} API请求失败，请检查网络后重试\n url: ${opts.url} \n data: ${JSON.stringify(err, null, 2)}`);
        } else {
          rtObj = $.toObj(data, {});
        }
      } catch (e) {
        $.logErr(`======== 账号 ${ac.no} ========\nurl: ${opts.url}\nerror:${e}\ndata: ${resp && resp.body}`)
      } finally {
        resolve(rtObj)
      }
    })
  })
}

//番茄看看key
function fqkk1(ac, fqjs, timeout = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let opts = {
        url: ac.url,
        headers: ac.headers,
        body: '',
      }
      $.post(opts, async (err, resp, data) => {
        let f = -1;
        let m = '';
        try {
          if (err) {
            $.logErr(`❌ 账号${ac.no} API请求失败，请检查网络后重试\n url: ${opts.url} \n data: ${JSON.stringify(err, null, 2)}`);
          } else {
            const result = JSON.parse(data)
            if (result.code == 0 && result.data && result.data.jkey) {
              $.log(`🌝账号${ac.no}获取key回执成功，开始第${fqjs}次跳转阅读📖`);
              let jumpObj = await fqkk2(ac, ac.url.replace('getTask', `jump?key=${result.data.jkey}`), 1);
              if (jumpObj) {
                let time = parseInt(Math.random() * (11 - 9 + 1) + 9, 10)
                $.log(`🌝账号${ac.no}等待${time}秒后提交本次阅读任务`)
                await $.wait(time * 1000)
                m = await fqkk3(ac, result.data.jkey);
                f = ac.rest;
              } else {
                $.log(`🌝账号${ac.no}jump接口请求失败，重新执行阅读任务`);
                await $.wait(1500);
              }
            } else {
              $.logErr(`🚫账号${ac.no}：获取key回执失败：${result.msg}`);
              if (ac.rest > 0) {
                await $.wait(1500);
              } else {
                f = 0;
              }
            }
          }
        } catch (e) {
          $.logErr(`======== 账号 ${ac.no} ========\nurl: ${opts.url}\nerror:${e}\ndata: ${resp && resp.body}`)
        } finally {
          resolve([f, m]);
        }
      })
    }, timeout)
  })
}

//提现
function fqkktx(ac) {
  return new Promise((resolve) => {
    let opts = {
      url: ac.url.match(/^(https?:\/\/.+?)\//)[1] + '/withdrawal/doWithdraw',
      headers: ac.headers,
      body: `amount=${Math.floor(ac.gold)}`
    }
    $.post(opts, async (err, resp, data) => {
      let msg = ''
      try {
        if (err) {
          $.logErr(`❌ 账号${ac.no} API请求失败，请检查网络后重试\n url: ${opts.url} \n data: ${JSON.stringify(err, null, 2)}`)
        } else {
          const result = JSON.parse(data)
          if (result.code == 0) {
            $.log(`🌝${$.name}账号${ac.no} 微信提现成功：${result.msg}`)
            msg = `已成功提现至微信${Math.floor(ac.gold) / 100}元`
          } else {
            msg = `🚫微信提现失败：${result.msg}`
          }
        }
      } catch (e) {
        $.logErr(`======== 账号 ${ac.no} ========\nurl: ${opts.url}\nerror:${e}\ndata: ${resp && resp.body}`)
      } finally {
        resolve(msg)
      }
    })
  })
}


function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

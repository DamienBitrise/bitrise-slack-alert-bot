const utils = require('./utils')
const fetch = require('node-fetch');

function getApps(all_apps, api_key, next, callback) {
  return fetch(utils.BASE_URL + (next ? '?next=' + next : ''), utils.getHeaders(api_key))
    .then(res => res.json())
    .then((apps) => {
      apps.data.forEach((app)=>{
        all_apps[app.slug] = {
          app
        };
      })
      if(apps.paging.next){
        getApps(all_apps, api_key, apps.paging.next, callback)
      } else {
        callback(all_apps);
      }
    }).catch((err) => {
      console.log('Error Getting Apps: ', err)
    });
}

function getBuilds(api_key, all_builds, from, to, appSlug, next, callback) {
  let fromDate = new Date(from);
  let toDate = new Date(to);
  let fromTimestamp = parseInt(fromDate.getTime()/1000);
  let toTimestamp = parseInt(toDate.getTime()/1000);
  let nextStr = next ? '?after='+fromTimestamp+'&before='+toTimestamp+'&next='+next : '?after='+fromTimestamp+'&before='+toTimestamp;
  let url = utils.BASE_URL+'/'+appSlug+'/builds'+nextStr;
  return fetch(url, utils.getHeaders(api_key))
    .then(res => res.json())
    .then((builds) => {
      if(!builds.paging){
        console.log('Error:', builds);
      }
      all_builds = all_builds.concat(builds.data)
      if(builds.paging.next){
        getBuilds(api_key, all_builds, from, to, appSlug, builds.paging.next, callback)
      } else {
        callback(all_builds);
      }
    });
}
module.exports = {
  getAllData: (appSlugsFilter, api_key, from, to, callback) => {
    let all_apps = {};
    getApps(all_apps, api_key, null, (apps) => {
      let appSlugs = Object.keys(apps);
      let complete = 0;
      appSlugs.forEach((appSlug)=>{
        if(!appSlugsFilter || appSlugsFilter.indexOf(appSlug) != -1){
          all_apps[appSlug] = apps[appSlug];
          let all_builds = [];
          getBuilds(api_key, all_builds, from, to, appSlug, 0, (builds) => {
            complete++;
            all_apps[appSlug].builds = builds;
            if(complete == appSlugs.length || (appSlugsFilter && complete == appSlugsFilter.length)){
              callback(all_apps);
            }
          })
        }
      });
    });
  },
  getStats: (appSlugsFilter, data) => {
    let appSlugs = Object.keys(data);
    let stats = {};
    appSlugs.forEach((appSlug) => {
      if(!appSlugsFilter || appSlugsFilter.indexOf(appSlug) != -1){
        let app = data[appSlug];
        app.builds.forEach((build) => {
          if(build.status_text != 'in-progress' && build.started_on_worker_at){
            let now = new Date();
            let triggered_at = new Date(build.triggered_at);
            let started_on_worker_at = new Date(build.started_on_worker_at);
            let queue_duration = (started_on_worker_at.getTime() - triggered_at.getTime()) / 60000;
            let finished_at = new Date(build.finished_at);
            let duration = (finished_at.getTime() - started_on_worker_at.getTime()) / 60000;
            
            let name = app.app.title;
            let workflow = build.triggered_workflow;
            let stack = build.stack_identifier;
            let branch = build.branch;
            let status = build.status_text;
            let slug = build.slug;

            let key = appSlug + '_' + 
                      workflow + '-' + 
                      status;
                      //  + '_' + 
                      // branch + '_' + 
                      // stack;
            if (!stats[key]) {
              stats[key] = {};
            }
            stats[key].app = name;
            stats[key].workflow = workflow;
            // stats[key].stack = stack;
            // stats[key].branch = branch;
            stats[key].status = status;
            stats[key].count = stats[key].count ? stats[key].count + 1 : 1;
            stats[key].total = stats[key].total ? stats[key].total + duration : duration;
            stats[key].avg = stats[key].total/stats[key].count;
            stats[key].queue_total = stats[key].queue_total ? stats[key].queue_total + queue_duration : queue_duration;

            let allKey = 'All_' + status;
            if (!stats[allKey]) {
              stats[allKey] = {};
            }
            stats[allKey].app = 'All';
            stats[allKey].workflow = 'All';
            stats[allKey].stack = 'All';
            stats[allKey].branch = 'All';
            stats[allKey].status = status;
            stats[allKey].count = stats[allKey].count ? stats[allKey].count + 1 : 1;
            stats[allKey].total = stats[allKey].total ? stats[allKey].total + duration : duration;
            stats[allKey].avg = stats[allKey].total/stats[allKey].count;
            stats[allKey].queue_total = stats[allKey].queue_total ? stats[allKey].queue_total + queue_duration : queue_duration;
          }
        })
      }
    });
    return stats;
  },
  getBuild: (api_key, appSlug, buildSlug, callback) => {
    let url = utils.BASE_URL+'/'+appSlug+'/builds/'+buildSlug;
    return fetch(url, utils.getHeaders(api_key))
      .then(res => res.json())
      .then((builds) => {
        callback(builds);
      });
  }
}
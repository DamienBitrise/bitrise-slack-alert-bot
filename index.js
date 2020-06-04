const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const fetch = require('node-fetch');
const utils = require('./utils')
const apiUtils = require('./apiUtils');
const rules = require('./rules');
const app = express();
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const UPDATE_INTERVAL = 10*60*1000; // 10 mins
let last_update = 0;

const PREVIOUS_DAYS_AVERAGE = 10;

let cached_stats = {};

function keepAlive(){
  fetch('https://BitriseAPI--damo1884.repl.co/')
    .then(res => res.json())
    .then((res) => {
      console.log('Keep Alive');
    });
}

setInterval(()=>{
  keepAlive()
}, 10*1000*60);

app.get('/', (req, res) => {
  console.log('/ health check');
  res.status(200).json({alive:true});
});

let update_in_progress = false;
app.post('/webhook', (req, res) => {
  console.log('/webhook');

  const API_KEY = req.header('BITRISE-API-KEY');
  let body = req.body;
  let buildStatus = body.build_status;

  if(buildStatus == 0){
    console.log('Build Started');
    res.status(200).json({alive:true});
    return;
  } else if(buildStatus == 1){
    console.log('Build Successful');
  } else if(buildStatus == 2){
    console.log('Build Failed');
  } else if(buildStatus == 3){
    console.log('Build Aborted with Failure');
  } else if(buildStatus == 4){
    console.log('Build Aborted with Success');
  }
  let workflow = body.build_triggered_workflow;

  let fromDate = new Date();
  fromDate.setDate( fromDate.getDate() - PREVIOUS_DAYS_AVERAGE );
  let from = fromDate.getTime();
  let toDate = new Date();
  let now = toDate.getTime();

  let appSlugs = req.header('appSlugs');
  if(!appSlugs || appSlugs == ''){
    appSlugs = null;
  } else {
    appSlugs = appSlugs.split(',')
  }
  let since_last_update = now - last_update;
  if(!update_in_progress && (!cached_stats || UPDATE_INTERVAL <= since_last_update)){
    update_in_progress = true;
    // console.log('Updating Cache');
    apiUtils.getAllData(appSlugs, API_KEY, from, now, (data) => {
      cached_stats = apiUtils.getStats(appSlugs, data);
      last_update = now;
      update_in_progress = false;

      apiUtils.getBuild(API_KEY, body.app_slug, body.build_slug, (build) => {
        let alerts = rules.processRules(body.app_slug, cached_stats, build.data);
        alerts.forEach((alert) => {
          // console.log('Alert: ', alert);

          utils.sendSlackMessage(body.app_slug, alert.build, alert.rule)
        })
      });

      res.status(200).json({success:true});
    });
  }else{
    // console.log('Using Cache');
    apiUtils.getBuild(API_KEY, body.app_slug, body.build_slug, (build) => {
        let alerts = rules.processRules(body.app_slug, cached_stats, build.data);
        alerts.forEach((alert) => {
          // console.log('Alert: ', alert);

          utils.sendSlackMessage(body.app_slug, alert.build, alert.rule)
        })
      });
    res.status(200).json({success:true});
  }
});

app.get('/stats', (req, res) => {
  console.log('/stats');
  res.json(cached_stats);
});

app.listen(3000, () => console.log('server started'));

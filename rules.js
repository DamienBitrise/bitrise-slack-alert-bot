const rules = [
  {
    type: 'percent',
    key: 'avg',
    max: 50,
    desc: 'Average build time exceeded by 50%'
  },
  {
    type: 'time',
    key: 'avg',
    max: 0.5,
    desc: 'Average build time exceeded by 0.5 mins'
  },
  {
    type: 'running',
    key: 'build',
    max: 10,
    desc: 'Max running builds below 10 - Contact Support'
  },
  {
    type: 'aborted',
    key: 'build',
    max: 0,
    desc: 'Aborted build detected'
  },
  {
    type: 'queue',
    key: 'build',
    max: 10,
    desc: 'Build queue time exceeded 10mins'
  }
];
module.exports = {
  processRules: (appSlug, stats, build) => {
    let alerts = [];
    rules.forEach((rule)=>{
      let key = appSlug + '_' + 
                      build.triggered_workflow + '-' + 
                      build.status_text;
      let workflow_stats = stats[key];
      if(!workflow_stats){
        console.log('Key not found in stats: ', key);
      } else {
        let started_on_worker_at = 0;
        let queue_duration = 0;
        let duration = 0;          
        let triggered_at = new Date(build.triggered_at);
        let finished_at = new Date(build.finished_at);
        if(build.started_on_worker_at){
          started_on_worker_at = new Date(build.started_on_worker_at);
          queue_duration = (started_on_worker_at.getTime() - triggered_at.getTime()) / 60000;
          duration = (finished_at.getTime() - started_on_worker_at.getTime()) / 60000;
        }
        if(rule.type == 'percent'){
          let average = workflow_stats[rule.key];
          let maxThreshold = average * (rule.max/100);
          console.log('percent: duration: ', duration, ' max: ', maxThreshold);
          if(duration >= maxThreshold){
            console.log('Rule Triggered: ', rule);
            alerts.push({
              rule,
              build
            });
          }
        } else if(rule.type == 'time') {
          let average = workflow_stats[rule.key];
          let maxThreshold = average + rule.max;
          console.log('percent: duration: ', duration, ' max: ', maxThreshold);
          if(duration >= maxThreshold){
            console.log('Rule Triggered: ', rule);
            alerts.push({
              rule,
              build
            });
          }
        } else if(rule.type == 'running') {
          // TODO Running
        } else if(rule.type == 'aborted') {
          if(build.status == 3 || build.status == 4){
            if(build.abort_reason != 'User Standard requested to abort this build.' &&
              build.abort_reason != 'Automatically aborted via Rolling Builds.'){
              console.log('Rule Triggered: ', rule);
            alerts.push({
              rule,
              build
            });
            }
          }
        } else if(rule.type == 'queue') {
          if(queue_duration >= rule.max){
            console.log('Rule Triggered: ', rule);
            alerts.push({
              rule,
              build
            });
          }
        }
      }
    });
    return alerts;
  }
}
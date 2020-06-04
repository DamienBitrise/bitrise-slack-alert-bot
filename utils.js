const fetch = require('node-fetch');
const SLACK_WEBHOOK_URL = '';
module.exports = {
  BASE_URL: 'https://api.bitrise.io/v0.1/apps',
  getHeaders: (api_key) => {
    return {
          headers: { 
            'accept': 'application/json',
            'Authorization': api_key
          },
      }
  },
  sendSlackMessage: (appSlug, build, rule) =>{
    let build_url = 'https://app.bitrise.io/build/' + build.slug;
    let abortReason = build.abort_reason ? '\n*Abort Reason:* '+build.abort_reason : '';

    let queueDuration = 0;
    let buildDuration = 0;
    let started_on_worker_at = 'NA';
    let triggered_at = new Date(build.triggered_at);
    let finished_at = new Date(build.finished_at);
    if(build.started_on_worker_at){
      started_on_worker_at = new Date(build.started_on_worker_at);
      queueDuration = ((started_on_worker_at.getTime() - triggered_at.getTime()) / 60000).toFixed(2);
      buildDuration = ((finished_at.getTime() - started_on_worker_at.getTime()) / 60000).toFixed(2);
    }
    fetch(SLACK_WEBHOOK_URL, {
        method: 'post',
        body:    JSON.stringify({
          'blocks': [
            {
              'type': 'section',
              'text': {
                'type': 'mrkdwn',
                'text': '*Alert Reason:* ' + rule.desc + 
                  abortReason +
                  '\n*Status:* '    + build.status_text +
                  '\n*Branch:* '    + build.branch +
                  '\n*Workflow:* '  + build.triggered_workflow +
                  '\n*Queue:* '     + queueDuration + ' mins' +
                  '\n*Duration:* '  + buildDuration + ' mins' +
                  '\n*Build URL:* ' + build_url
              }
            }
          ]
        }),
        headers: { 'Content-Type': 'application/json' },
    })
      .then(res => {
        console.log('Slack Response: ', res.status);
        if(res.status == 200){
          console.log('Slack Message Sent Successfully')
        }else{
          console.log('Slack Message Failed to Send')
        }
      })
      .catch((err) => {
        console.log('Error: ', err);
      });
  }
}

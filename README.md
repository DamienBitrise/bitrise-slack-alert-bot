# bitrise-slack-alert-bot
Simple Rules Engine to alert when Bitrise builds meet certain conditions

![](images/alert.png)

# Run Locally

## Install Dependencies

```npm i```

## Running Slack Alert Bot

```node index.js```

# Run on Repl.it

[![Run on Repl.it](https://repl.it/badge/github/DamienBitrise/bitrise-slack-alert-bot)](https://repl.it/github/DamienBitrise/bitrise-slack-alert-bot)

# Configuring Bitrise Build Webhook

![](images/webhook.png)

# Adding new Alert Rules

In [rules.js](https://github.com/DamienBitrise/bitrise-slack-alert-bot/blob/master/rules.js#L1-L32) you can add new rules

You will need to handle new rules here [rules.js](https://github.com/DamienBitrise/bitrise-slack-alert-bot/blob/master/rules.js#L54-L98)

# Slack Notification

You can update the format and contents of the slack notification in [utils.js](https://github.com/DamienBitrise/bitrise-slack-alert-bot/blob/master/utils.js#L12-L60)


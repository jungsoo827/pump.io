let fs = require("fs");
let path = require("path");
let databank = require("databank");
let Databank = databank.Databank;
let DatabankObject = databank.DatabankObject;
let firebase = require('../lib/firebase');

var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "config.json")));

var db = Databank.get(config.driver, config.params);

db.connect({}, function(){
  DatabankObject.bank = db;

  firebase.createChat('js5', 'title1', ['js4', 'js6']).then(function (chatId) {
    console.log(chatId);
    let now = new Date();
    firebase.addChatMessage(chatId, 'js4', now.toISOString(), 'test message').then(function (chatMessageId) {
      // process.exit(0);
      let now2 = new Date();
      firebase.addChatMessage(chatId, 'js6', now2.toISOString(), 'test message 2').then(function (chatMessageId) {
        firebase.getChatListByUserId('js5').then(function (data) {
          console.log(data)
        });
      });
    })
  });
});



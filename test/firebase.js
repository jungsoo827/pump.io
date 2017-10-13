let firebase = require('../lib/firebase');

firebase.createChat('123','title1', ['1','2']).then(function(chatId){
  console.log(chatId);
  let now = new Date();
  firebase.addChatMessage(chatId, '1', now.toISOString(), 'test message').then(function(chatMessageId){
    // process.exit(0);
  })
});

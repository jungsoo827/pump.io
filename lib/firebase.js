let admin = require("firebase-admin");

// let serviceAccount = require("/opt/pump.io/rimbolapp-firebase-adminsdk-lgrdk-450c8a49ac.json");
let serviceAccount = require("D:/git/pump.io/rimbolapp-firebase-adminsdk-lgrdk-450c8a49ac.json");

const DB_REF_PREFIX_CHATS = '/chats';
const DB_REF_PREFIX_CHAT_MEMBERS = '/chat_members';
const DB_REF_PREFIX_CHAT_MESSAGES = '/chat_messages';
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rimbolapp.firebaseio.com"
});

let db = admin.database();


// let sendChatMessage = function (chatId, fromUserId, message) {
//   let ref = db.ref(DB_REF_PREFIX_CHATS + '/' + chatId);
//   let obj = {
//     fromUserId: fromUserId,
//     message: message,
//     readUserIdList: [fromUserId]
//   };
//   let messagesRef = ref.child('messages');
//   let newChatMessageRef = messagesRef.push();
//   newChatMessageRef.set(obj);
//   return newChatMessageRef.key;
// };
// module.exports.sendChatMessage = sendChatMessage;

let createChat = function (createUserId, title, memberUserIdList) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHATS);
    let newChatRef = ref.push();

    let now = new Date();
    let obj = {
      createUserId: createUserId,
      title: title,
      lastMessage: '',
      timestamp: now.toISOString()
    };

    newChatRef.set(obj);
    let chatId = newChatRef.key;

    if (!memberUserIdList) {
      memberUserIdList = [];
    }
    let found = false;
    for (let i = 0; i < memberUserIdList.length; i++) {
      if (memberUserIdList[i] === createUserId) {
        found = true;
        break;
      }
    }
    if (found === false) {
      memberUserIdList.push(createUserId);
    }
    addChatMembers(chatId, memberUserIdList).then(function (data) {
      resolve(chatId);
    });
  });

};
module.exports.createChat = createChat;

let addChatMembers = function (chatId, newMemberUserIdList) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_MEMBERS);
    let chlidRef = ref.child(chatId);
    if (newMemberUserIdList && newMemberUserIdList.length > 0) {
      chlidRef.once('value').then(function (snapshot) {
        let membersMap = snapshot.val();
        if (!membersMap) {
          membersMap = {};
        }
        for (let i = 0; i < newMemberUserIdList.length; i++) {
          membersMap[newMemberUserIdList[i]] = true;
        }
        chlidRef.set(membersMap);
        resolve();
      });
    } else {
      resolve();
    }
  });

};
module.exports.addChatMembers = addChatMembers;


let removeChatMembers = function (chatId, memberUserIdList) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_MEMBERS + '/' + chatId);
    if (memberUserIdList && memberUserIdList.length > 0) {
      ref.once('value').then(function (snapshot) {
        let membersMap = snapshot.val();

        for (let i = 0; i < memberUserIdList.length; i++) {
          membersMap[memberUserIdList[i]] = false;
        }
        ref.set(membersMap);
        resolve();
      });
    }

  });

};
module.exports.removeChatMembers = removeChatMembers;

let addChatMessage = function (chatId, sendUserId, dateISOString, message) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_MESSAGES + '/' + chatId);
    let oneMessageRef = ref.push();
    oneMessageRef.set({
      sendUserId: sendUserId,
      timestamp: dateISOString,
      message: message
    })
    resolve(oneMessageRef.key);
  });

};
module.exports.addChatMessage = addChatMessage;

//
// let createChatByUserId = function (userId, chatId) {
//   let ref = db.ref(DB_REF_PREFIX_CHAT_BY_USER_ID + '/' + userId);
//   let newRef = ref.push();
//   let obj = {
//     chatId: chatId,
//   };
//
//   newRef.set(obj);
// };
// module.exports.createChatByUserId = createChatByUserId;
//
// let readChatMessage = function (chatId, messageId, userId) {
//   let ref = db.ref(DB_REF_PREFIX_CHAT + '/' + chatId + '/messages/' + messageId);
//   ref.once('value').then(function (snapshot) {
//     let readUserIdList = snapshot.val().readUserIdList;
//     if (!readUserIdList) {
//       ref.update({readUserIdList: [userId]});
//     } else {
//       let found = false;
//       for (let i = 0; i < readUserIdList.length; i++) {
//         if (readUserIdList[i] === userId) {
//           found = true;
//           break;
//         }
//       }
//       if (found === false) {
//         readUserIdList.push(userId)
//         ref.update({readUserIdList: readUserIdList});
//       }
//     }
//   });
//
// };
// module.exports.readChatMessage = readChatMessage;

let getChatListByUserId = function (userId) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_MEMBERS + '/' + chatId);
    let oneMessageRef = ref.push();
    oneMessageRef.set({
      sendUserId: sendUserId,
      timestamp: dateISOString,
      message: message
    })
  });

};
module.exports.getChatListByUserId = getChatListByUserId;
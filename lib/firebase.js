let async = require("async");
let admin = require("firebase-admin");
let User = require("./model/user").User;

// let serviceAccount = require("/opt/pump.io/rimbolapp-firebase-adminsdk-lgrdk-450c8a49ac.json");
let serviceAccount = require("D:/git/pump.io/rimbolapp-firebase-adminsdk-lgrdk-450c8a49ac.json");

const DB_REF_PREFIX_CHATS = '/chats';
const DB_REF_PREFIX_MESSAGES = '/messages';
const DB_REF_PREFIX_CHAT_MEMBERS = '/chat_members';
const DB_REF_PREFIX_CHAT_BY_USER_ID = '/chat_by_user_id';
const DB_REF_PREFIX_CHAT_MESSAGES = '/chat_messages';
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rimbolapp.firebaseio.com"
});

let db = admin.database();


let createChat = function (create_user_id, title, memberUserIdList) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHATS);
    let newChatRef = ref.push();

    let now = new Date();
    let obj = {
      create_user_id: create_user_id,
      title: title,
      last_message: '',
      timestamp: now.toISOString()
    };

    newChatRef.set(obj);
    let chatId = newChatRef.key;

    if (!memberUserIdList) {
      memberUserIdList = [];
    }
    let found = false;
    for (let i = 0; i < memberUserIdList.length; i++) {
      if (memberUserIdList[i] === create_user_id) {
        found = true;
        break;
      }
    }
    if (found === false) {
      memberUserIdList.push(create_user_id);
    }
    addChatMembers(chatId, memberUserIdList).then(function (data) {
      resolve(chatId);
    });
  });

};
module.exports.createChat = createChat;

let getChatMembers = function (chatId) {
  return new Promise(function (resolve, reject) {
    let memberList = [];
    let cmRef = db.ref(DB_REF_PREFIX_CHAT_MEMBERS + '/' + chatId);
    cmRef.once('value').then(function (cmSnapShot) {
      let dbCm = cmSnapShot.val();
      async.forEachOf(dbCm, function (value, key, innerCallback) {
        User.get(key, function (err, result) {
          if (!err) {
            memberList.push({
              user_id: key,
              email: result.email,
              name: result.name
            });
          }
          innerCallback();
        });
      }, function (err) {
        resolve(memberList);
      });
    });
  });
};
module.exports.getChatMembers = getChatMembers;

let getChatMessages = function (chatId) {
  return new Promise(function (resolve, reject) {
    let msgList = [];
    let ref = db.ref(DB_REF_PREFIX_CHAT_MESSAGES + '/' + chatId + '/' + DB_REF_PREFIX_MESSAGES);
    ref.once('value').then(function (snapShot) {
      let dbData = snapShot.val();
      for (let i = 0; i < dbData.length; i++) {
        let oneDbData = dbData[i];
        msgList.push({
          message: oneDbData.message,
          send_user_id: oneDbData.send_user_id,
          timestamp: oneDbData.timestamp
        })
      }
      resolve(msgList);
    });
  });
};
module.exports.getChatMessages = getChatMessages;

let getChat = function (chatId) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHATS + '/' + chatId);
    let chatObject = {};
    ref.once('value').then(function (snapshot) {
      let dbChat = snapshot.val();
      if (dbChat) {
        chatObject.create_user_id = dbChat.create_user_id;
        chatObject.last_message = dbChat.last_message;
        chatObject.timestamp = dbChat.timestamp;
        chatObject.title = dbChat.title;

        getChatMembers(chatId).then(function (data) {
          chatObject.member_list = data;
          getChatMessages(chatId).then(function (msgData) {
            chatObject.message_list = msgData;
            resolve(chatObject);
          });
        });
      } else {
        resolve(null);
      }
    });
  });

};
module.exports.getChat = getChat;

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
        async.forEach(newMemberUserIdList, function (oneUserId, innerCallback) {
          membersMap[oneUserId] = true;
          addChatToUser(chatId, oneUserId).then(function (data) {
            innerCallback();
          }).catch(function (err) {
            innerCallback(err);
          })
        }, function (err) {
          if (err) {
            reject(err);
          } else {
            chlidRef.set(membersMap);
            resolve();
          }
        });
      });
    } else {
      resolve();
    }
  });

};
module.exports.addChatMembers = addChatMembers;


let addChatToUser = function (chatId, userId) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_BY_USER_ID + '/' + userId);
    let chlidRef = ref.child(DB_REF_PREFIX_CHATS);
    chlidRef.once('value').then(function (snapshot) {
      let chatList = snapshot.val();
      if (!chatList) {
        chatList = [];
      }
      chatList.push(chatId);
      chlidRef.set(chatList);
      resolve();
    });
  });
};
module.exports.addChatToUser = addChatToUser;


let removeChatFromUser = function (chatId, userId) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_BY_USER_ID + '/' + userId);
    let chlidRef = ref.child('chats');
    chlidRef.once('value').then(function (snapshot) {
      let chatList = snapshot.val();
      if (chatList && chatList.length > 0) {
        let foundIndex = chatList.indexOf(chatId);
        if (foundIndex > -1) {
          chatList.splice(foundIndex, 1);
          chlidRef.set(chatList);
        }
      }
      resolve();
    });
  });
};
module.exports.removeChatFromUser = removeChatFromUser;

let removeChatMembers = function (chatId, memberUserIdList) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_MEMBERS + '/' + chatId);
    if (memberUserIdList && memberUserIdList.length > 0) {
      ref.once('value').then(function (snapshot) {
        let membersMap = snapshot.val();

        async.forEach(memberUserIdList, function (oneUserId, innerCallback) {
          membersMap[oneUserId] = false;
          removeChatFromUser(chatId, oneUserId).then(function (data) {
            innerCallback();
          }).catch(function (err) {
            innerCallback(err);
          })
        }, function (err) {
          if (err) {
            reject(err);
          } else {
            ref.set(membersMap);
            resolve();
          }
        });
      });
    }
  });

};
module.exports.removeChatMembers = removeChatMembers;

let addChatMessage = function (chatId, send_user_id, dateISOString, message) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_MESSAGES + '/' + chatId);
    let chlidRef = ref.child(DB_REF_PREFIX_MESSAGES);
    chlidRef.once('value').then(function (snapshot) {
      let dataList = snapshot.val();
      if (!dataList) {
        dataList = [];
      }
      dataList.push({
        send_user_id: send_user_id,
        timestamp: dateISOString,
        message: message
      });
      chlidRef.set(dataList);
      resolve();
    });
  });

};
module.exports.addChatMessage = addChatMessage;


let getChatListByUserId = function (userId) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHAT_BY_USER_ID + '/' + userId + '/' + DB_REF_PREFIX_CHATS);
    ref.once('value').then(function (snapshot) {
      let chatIdList = snapshot.val();
      let chatList = [];
      async.forEach(chatIdList, function (oneChatId, innerCallback) {
        getChat(oneChatId).then(function (data) {
          chatList.push(data);
          innerCallback();
        })
      }, function (err) {
        resolve(chatList);
      });
    });
  });

};
module.exports.getChatListByUserId = getChatListByUserId;

let removeChat = function (userId, chatId) {
  return new Promise(function (resolve, reject) {
    let ref = db.ref(DB_REF_PREFIX_CHATS + '/' + chatId);
    ref.remove().then(function (snapshot) {
      let msgRef = db.ref(DB_REF_PREFIX_CHAT_MESSAGES + '/' + chatId);
      msgRef.remove().then(function (snapshot) {
        getChatMembers(chatId).then(function (memberList) {
          async.forEach(memberList, function (oneMember, innerCallback) {

            let tempRef = db.ref(DB_REF_PREFIX_CHAT_BY_USER_ID + '/' + oneMember.user_id + '/' + DB_REF_PREFIX_CHATS);
            tempRef.once('value').then(function (snapshot) {
              let chatList = snapshot.val();
              for (let i = 0; i < chatList.length; i++) {
                if (chatList[i] === chatId) {
                  chatList.splice(i, 1);
                  tempRef.set(chatList);
                  break;
                }
              }
              innerCallback(null);
            }).catch(function (err) {
              innerCallback(err);
            });
          }, function (err) {
            if (err) {
              reject(err);
            } else {
              let memberRef = db.ref(DB_REF_PREFIX_CHAT_MEMBERS + '/' + chatId);
              memberRef.remove().then(function (snapshot) {
                resolve(null);
              }).catch(function (err) {
                reject(err);
              });
            }
          });
        }).catch(function (err) {
          reject(err);
        });
      }).catch(function (err) {
        reject(err);
      });
    }).catch(function (err) {
      reject(err);
    });
  });

};
module.exports.removeChat = removeChat;
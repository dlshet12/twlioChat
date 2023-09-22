var express = require('express')
var cors = require('cors')
var app = express();
app.use(express.json())

const twilioAccountSid = "AC5e774af019192c57c653440f4c5b80d5";
const twilioApiKey = "SKe43b757259562644f940b532a21ef882";
const twilioApiSecret = "yGJsgSeYqIDj94fa15WWPIVAFzUUzZvP";
const serviceSid = "ISab92220c61fd40cfb241d110ffc51a2b";

const fs = require('fs');
const dataFilePath = 'chatData.json';
function findOrCreateChatRoom(user1, user2) {
  // Read the data from the file, or initialize an empty array if the file does not exist
  let chatData = [];
  if (fs.existsSync(dataFilePath)) {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    chatData = JSON.parse(fileContents);
  }

  // Check if a chat room already exists for user1 and user2
  for (const entry of chatData) {
    const key = Object.keys(entry)[0];
    const val = entry[key].chattingWith;
    if ((key === user1 && val === user2) || (key === user2 && val === user1)) {
      return entry[key].chatRoomName;
    }
  }

  // If no chat room exists, generate a unique chatRoomName
  let chatRoomName;
  do {
    chatRoomName = generateUniqueChatRoomName();
  } while (chatData.some(entry => Object.values(entry)[0].chatRoomName === chatRoomName));

  // Create a new entry for the chat room and store it in the data array
  const newEntry = {
    [user1]: { chattingWith: user2, chatRoomName },
  };
  chatData.push(newEntry);

  // Write the updated data back to the file
  fs.writeFileSync(dataFilePath, JSON.stringify(chatData, null, 2));

  return chatRoomName;
}

function generateUniqueChatRoomName() {
  // Generate a random chat room name (you can customize this logic)
  return 'chatRoom' + Math.floor(Math.random() * 10000);
}

app.use(cors())

app.post('/twilio/token/:identity', async (req, res, next) => {
  let { receiver_id: user2} = req.body 
  if (!user2) {
    user2 = 'nil';
  }
  console.log('USER ID: ', user2)
    const token = await generateToken(String(req.params.identity))
    const chatroomName = findOrCreateChatRoom(String(req.params.identity), String(user2));
    res.send({ chat_token: token.toJwt(), chat_room: { name: chatroomName } });
})

const PORT = process.env.PORT || 4000;

app.listen(PORT, function (identity) {
  console.log(`CORS-enabled web server listening on port ${PORT}`)
})

async function generateToken(identity) {
  const AccessToken = require('twilio').jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;

// Create a "grant" which enables a client to use Chat as a given user,
// on a given device
const chatGrant = new ChatGrant({
  serviceSid: serviceSid,
});

// Create an access token which we will sign and return to the client,
// containing the grant we just created
const token = new AccessToken(
  twilioAccountSid,
  twilioApiKey,
  twilioApiSecret,
  {identity: identity}
);

token.addGrant(chatGrant);

// Serialize the token to a JWT string
console.log(token.toJwt());
return token;
}
const savedKey= localStorage.getItem('key');

const key = savedKey ? savedKey : prompt('Enter the super secret password:');


const encryptedMessage = '585ffd5f21d78cc146686bb5ae463b30d04d08b283a358e1125d2b2c7c262fe6';

// Decrypt the message using AES256 CBC mode
function decrypt(encryptedMessage) {
  const ciphertextBuffer = forge.util.createBuffer();
  ciphertextBuffer.putBytes(forge.util.hexToBytes(encryptedMessage));
  const iv = ciphertextBuffer.getBytes(16);
  const cipherText = ciphertextBuffer.getBytes();
  const decipher = forge.cipher.createDecipher('AES-CBC', key);
  decipher.start({ iv: iv });
  decipher.update(forge.util.createBuffer(cipherText));
  decipher.finish();
  return decipher.output.toString();
}

const decryptedMessage = decrypt(encryptedMessage);

const sheetDB = require('sheetdb-node');
const client = sheetDB({ address: decryptedMessage })

function update() {
  let data;

  let regex = /^\w{3},\s\w{3}\s\d{1,2}$/;

  let validAnnouncementsStart = [];
  let validAnnouncementsEnd = [];
  let validAnnouncements = [];

  client.read().then((sheet) => {
    data = JSON.parse(sheet);
    processData(data)
  })

  function processData(data) {
    let response;
    for (let i = 0; i < data.length; i++) {
      response = data[i];
      if (regex.test(response['Start Date (First day for announcement)'])) {
        let date = new Date(response['Start Date (First day for announcement)']);

        if (date.getMonth() >= 6) {
          date.setFullYear(new Date().getFullYear() - 1);
        } else {
          date.setFullYear(new Date().getFullYear());
        }

        validAnnouncementsStart.push({ i, date, announcement: response['Announcement (As you wish to have it read by members of Student Council)'] });
      } else {
        continue;
      }

      if (regex.test(response['End Date (Final day for announcement)'])) {
        const date = new Date(response['End Date (Final day for announcement)']);

        if (date.getMonth() >= 6) {
          date.setFullYear(new Date().getFullYear() - 1);
        } else {
          date.setFullYear(new Date().getFullYear());
        }

        validAnnouncementsEnd.push({ i, date });
      } else {
        validAnnouncementsEnd.push({ i, date: validAnnouncementsStart.find(begin => begin.i === i).date });
      }
    }

    validAnnouncementsStart.forEach(begin => {
      const end = validAnnouncementsEnd.find(obj => obj.i === begin.i);
      if (end) {
        //   check if the current date is between the start and end dates
        if (begin.date <= new Date() && end.date >= new Date().setDate(new Date().getDate() - 1)) {
          validAnnouncements.push(begin.announcement);
        }
      }
    });

    for (let announcement of validAnnouncements) {
      const announcementDiv = document.createElement('div');
      announcementDiv.classList.add('announcement');
      announcementDiv.innerHTML = announcement
      document.getElementById('announcement-wrapper').appendChild(announcementDiv);
    }

    localStorage.setItem('announcements', JSON.stringify(validAnnouncements));
    localStorage.setItem('lastUpdated', Date.now().toString());
  }
}

//  if updated less than 24 hours ago, use the cached announcements
if (Date.now() - localStorage.getItem('lastUpdated') < 1000 * 60 * 60 * 24) {
  const announcements = JSON.parse(localStorage.getItem('announcements'));
  for (let announcement of announcements) {
    const announcementDiv = document.createElement('div');
    announcementDiv.classList.add('announcement');
    announcementDiv.innerHTML = announcement
    document.getElementById('announcement-wrapper').appendChild(announcementDiv);
  }
} else {
update();
}

setInterval(() => {
  if (Date.now() - localStorage.getItem('lastUpdated') > 1000 * 60 * 60 * 24) {
    update();
    console.log('Updated announcements')
  } else {
    console.log('Announcements are up-to-date')
  }
}, 5 * 60 * 1000); // check for updates every 5 minutes
localStorage.setItem('key', key);

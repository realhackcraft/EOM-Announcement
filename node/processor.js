// loop over every json file in the responses folder

const fs = require('fs');
const path = require('path');

const responses = fs.readdirSync(path.join(__dirname, 'responses'));
let regex = /^\w{3},\s\w{3}\s\d{1,2}$/;

let validAnnouncementsStart = [];
let validAnnouncementsEnd = [];
let validAnnouncements = [];

for (let i = 0; i < responses.length; i++) {
  const response = responses[i];
  const responseJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'responses', response)));

  if (regex.test(responseJSON['Start Date (First day for announcement)'])) {
    let date = new Date(responseJSON['Start Date (First day for announcement)']);

    if (date.getMonth() >= 6) {
      date.setFullYear(new Date().getFullYear() - 1);
    } else {
      date.setFullYear(new Date().getFullYear());
    }

    validAnnouncementsStart.push({ i, date, announcement: responseJSON['Announcement (As you wish to have it read by members of Student Council)'] });
  } else {
    continue;
  }

  if (regex.test(responseJSON['End Date (Final day for announcement)'])) {
    const date = new Date(responseJSON['End Date (Final day for announcement)']);

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

fs.writeFileSync(path.join(__dirname, 'validAnnouncements.json'), JSON.stringify(validAnnouncements));
fs.writeFileSync(path.join(__dirname, 'validAnnouncementsObj.js'), `const announcements = ${JSON.stringify(validAnnouncements)}`);
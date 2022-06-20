const { request } = require('express');
const express = require('express');

const app = express();

const port = 8000;

app.set('view engine', 'hbs'); //set view engine

app.use('/assets', express.static(__dirname + '/assets'));

app.use(express.urlencoded({ extended: false }));

let isLogin = true;
let projectDetail = [
  {
    title: 'Aplikasi Dumbways 2021',
    content:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem reiciendis consectetur a. Id aperiam deserunt blanditiis tempora maxime nobis, accusamus atque delectus, blanditiis neque?',
    duration: '3 bulan',
    reactjs: 'fa-brands fa-react fa-2xl',
    go: 'fa-brands fa-golang fa-2xl',
  },
];

app.get('/', function (request, response) {
  let data = projectDetail.map(function (item) {
    return {
      ...item,
      isLogin,
    };
  });

  //console.log(data);

  response.render('index', { isLogin, full: data });
});

app.get('/contact-me', function (request, response) {
  response.render('contact-me');
});

app.get('/add-project', function (request, response) {
  response.render('add-project');
});

app.get('/project-detail/:index', function (request, response) {
  let index = request.params.index;
  //console.log(index);

  let detail = projectDetail[index];

  //console.log(detail);

  response.render('project-detail', detail);
});

app.get('/update-project/:index', function (request, response) {
  let index = request.params.index;

  let updateData = projectDetail[index];

  response.render('update-project', { updateData, full: index });
});

app.post('/update-project/:index', function (request, response) {
  let updated = request.body;
  let index = request.params.index;

  updated = {
    title: updated.inputTitle,
    startDate: updated.inputStartDate,
    endDate: updated.inputEndDate,
    duration: distance(updated.inputStartDate, updated.inputEndDate),
    content: updated.desc,
    nodejs: updated.check1,
    reactjs: updated.check2,
    ruby: updated.check3,
    go: updated.check4,
  };

  projectDetail[index] = updated;
  response.redirect('/');
});

app.post('/add-project', function (request, response) {
  let allData = request.body;

  allData = {
    title: allData.inputTitle,
    startDate: allData.inputStartDate,
    endDate: allData.inputEndDate,
    duration: distance(allData.inputStartDate, allData.inputEndDate),
    content: allData.desc,
    nodejs: allData.check1,
    reactjs: allData.check2,
    ruby: allData.check3,
    go: allData.check4,
    image: 'no image',
  };

  projectDetail.push(allData);
  response.redirect('/');

  //console.log();
});

app.get('/delete-project/:index', function (request, response) {
  // console.log(request.params.index);
  let index = request.params.index;
  projectDetail.splice(index, 1);

  response.redirect('/');
});

app.listen(port, function () {
  console.log(`Server running on port ${port}`);
});

function distance(start, end) {
  let timeLine;
  let startDate = new Date(start);
  let endDate = new Date(end);

  if (endDate >= startDate) {
    timeLine = new Date(endDate - startDate);
  } else {
    return 'End Date Ngaco!, Periksa kembali tanggal anda!';
  }

  let distance = Math.floor(timeLine / (1000 * 3600 * 24));
  let distanceMonth = Math.floor(distance / 30);
  let distanceYears = Math.floor(distanceMonth / 12);

  //console.log(distance);

  //menghitung timeline project
  if (distance < 30) {
    return (timeLine = 'Dibawah 1 Bulan');
  } else if (distance >= 30 && distance < 365) {
    return (timeLine = `${distanceMonth} Bulan`);
  } else {
    return (timeLine = `sekitar ${distanceYears} Tahun`);
  }
}

const { request } = require('express');
const express = require('express');
const bcrypt = require('bcrypt')
const session = require('express-session')
const flash = require('express-flash')

const app = express();

const port = 8000;

app.use(flash()) //use flash message

app.use(session({
  secret: 'koderahasia',
  resave: false,
  saveUninitialized: true,
  cookie: { 
      maxAge: 2 * 60 * 60 * 1000 // 2 HOURS MAX SESSION
   }
}))

const db = require('./connection/db');

app.set('view engine', 'hbs'); //set view engine

app.use('/assets', express.static(__dirname + '/assets'));

app.use(express.urlencoded({ extended: false }));

//let isLogin = false;
// let projectDetail = [
//   {
//     title: 'Aplikasi Dumbways 2021',
//     content:
//       'Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem reiciendis consectetur a. Id aperiam deserunt blanditiis tempora maxime nobis, accusamus atque delectus, blanditiis neque?',
//     duration: '3 bulan',
//     reactjs: 'fa-brands fa-react fa-2xl',
//     go: 'fa-brands fa-golang fa-2xl',
//   },
// ];

db.connect(function (err, client, done) {
  if (err) throw err; //menampilkan error koneksi db

  app.get('/', function (request, response) {
    //console.log(data);

    client.query('SELECT * FROM tb_projects', function (err, result) {
      if (err) throw err;
      //console.log(result.rows);

      let data = result.rows;

      let allData = data.map(function (item) {
        return {
          ...item,
          isLogin: request.session.isLogin, //isLogin becoming session
          duration: distance(
            new Date(item.startDate),
            new Date(item.endDate)
          ),
        };
      });

      response.render('index', { full: allData, user: request.session.user, isLogin: request.session.isLogin});
    });
  });

  app.get('/contact-me', function (request, response) {
    response.render('contact-me', {user: request.session.user, isLogin: request.session.isLogin});
  });


  //REGISTRATION

  app.get('/register', function (request, response) {
    response.render('register');
  });

  app.post('/register', function(request,response){
    // let data = request.body

    let {inputName, inputEmail, inputPassword} = request.body

    const encryptPassword = bcrypt.hashSync(inputPassword, 10)
    //encrypt password with 10 salt rounds (Cost Duration time)

    //console.log(inputName,inputEmail,encryptPassword);

     const query = `INSERT INTO tb_users(name, email, password)
     VALUES ('${inputName}', '${inputEmail}', '${encryptPassword}');`

    client.query(query, function(err, result){
        if(err) throw err
        request.flash('success', 'Berhasil Mendaftar!');
        response.redirect('/login')
    })

})


  //LOGIN

  app.get('/login', function (request, response) {
    response.render('login');
  });

  app.post('/login', function(request,response){

    let {inputEmail, inputPassword} = request.body

    const query = `SELECT * FROM tb_users WHERE email='${inputEmail}'`

    client.query(query, function(err, result){
        if(err) throw err

        console.log(result.rows);

        //Checking tb_users for existing email
        if(result.rows.length == 0){
            request.flash('danger', 'Email belum terdaftar!')
            return response.redirect('/login')
        }

        //matching input password to DB using bcrypt.compareSync
        const passMatch = bcrypt.compareSync(inputPassword, result.rows[0].password)

        if(passMatch){
            // Creating Session using the selected user using isLogin
            request.session.isLogin = true
            request.session.user = {
                id: result.rows[0].id,
                name: result.rows[0].name,
                email: result.rows[0].email,
            }

            request.flash('success', 'Login Success')
            response.redirect('/')

        } else {
            request.flash('danger', 'Password Salah!')
            response.redirect('/login')
        }
    })
})

  app.get('/add-project', function (request, response) {

    //check if user has logged in
    if(!request.session.user){
      request.flash('notLogin', 'Silahkan Login Terlebih Dahulu!')
      return response.redirect('/login')
    }

    response.render('add-project', {user: request.session.user, isLogin: request.session.isLogin});
  });

  app.get('/project-detail/:index', function (request, response) {
    let index = request.params.index;

    //console.log(index);
    //let detail = projectDetail[index];
    //console.log(detail);

    client.query(
      `SELECT * FROM tb_projects WHERE id=${index}`,
      function (err, result) {
        if (err) throw err;

        let detail = result.rows[0];

        detail = {
          title: detail.title,
          startDate: fullTime(detail.startDate),
          endDate: fullTime(detail.endDate),
          duration: distance(detail.startDate, detail.endDate),
          content: detail.content,
          nodejs: detail.nodejs,
          reactjs: detail.reactjs,
          ruby: detail.ruby,
          go: detail.go,
        };
        response.render('project-detail', detail);
      }
    );
  });

  app.get('/update-project/:index', function (request, response) {
    let index = request.params.index;

    client.query(
      `SELECT * FROM tb_projects WHERE id=${index}`,
      function (err, result) {
        if (err) throw err;

        let updateData = result.rows[0];

        updateData = {
          title: updateData.title,
          startDate: updateData.startDate,
          endDate: updateData.endDate,
          content: updateData.content,
          nodejs: updateData.nodejs,
          reactjs: updateData.reactjs,
          ruby: updateData.ruby,
          go: updateData.go,
        };

        let beginDate = new Date(updateData.startDate).toISOString().split('T')[0];
        let finishDate = new Date(updateData.endDate).toISOString().split('T')[0];

        response.render('update-project', {
          updateData: updateData,
          beginDate,
          finishDate,
          full: index,
        });
      }
    );

    //let updateData = projectDetail[index];
  });

  app.post('/update-project/:index', function (request, response) {
    let updated = request.body;
    let index = request.params.index;

    const query = `UPDATE tb_projects 
    SET title='${updated.inputTitle}', 
      content='${updated.desc}', 
      "startDate"='${updated.inputStartDate}', 
      "endDate"='${updated.inputEndDate}', 
      nodejs='${updated.check1}', 
      reactjs='${updated.check2}', 
      ruby='${updated.check3}', 
      go='${updated.check4}'
      WHERE id=${index}`;

    client.query(query, function (err, result) {
      if (err) throw err;

      // updated = {
      //   title: updated.inputTitle,
      //   startDate: updated.inputStartDate,
      //   endDate: updated.inputEndDate,
      //   duration: distance(
      //     updated.inputStartDate,
      //     updated.inputEndDate
      //   ),
      //   content: updated.desc,
      //   nodejs: updated.check1,
      //   reactjs: updated.check2,
      //   ruby: updated.check3,
      //   go: updated.check4,
      // };

      // projectDetail[index] = updated;

      response.redirect('/');
    });
    done;
  });

  app.post('/add-project', function (request, response) {
    const allData = request.body;

    // allData = {
    //   title: allData.inputTitle,
    //   startDate: allData.inputStartDate,
    //   endDate: allData.inputEndDate,
    //   duration: distance(
    //     allData.inputStartDate,
    //     allData.inputEndDate
    //   ),
    //   content: allData.desc,
    //   nodejs: allData.check1,
    //   reactjs: allData.check2,
    //   ruby: allData.check3,
    //   go: allData.check4,
    //   image: 'no image',
    // };

    const query = `INSERT INTO tb_projects(title, content, "startDate", "endDate", nodejs, reactjs, ruby, go)
      VALUES ('${allData.inputTitle}', '${allData.desc}', 
      '${allData.inputStartDate}', '${allData.inputEndDate}', 
      '${allData.check1}', 
      '${allData.check2}', 
      '${allData.check3}', 
      '${allData.check4}')`;

    client.query(query, function (err, result) {
      if (err) throw err;

      response.redirect('/');
    });

    //console.log();
  });

  app.get('/delete-project/:index', function (request, response) {
    // console.log(request.params.index);
    let index = request.params.index;

    client.query(
      `DELETE FROM tb_projects WHERE id=${index}`,
      function (err, result) {
        if (err) throw err;
        response.redirect('/');
      }
    );
  });

  app.get('/logout', function(request,response){
    request.session.destroy()
    response.redirect('/')
  })

  app.listen(port, function () {
    console.log(`Server running on port ${port}`);
  });
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

function fullTime(tanggal) {
  let month = [
    'Januari',
    'Febuari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  let date = tanggal.getDate();
  let monthIndex = tanggal.getMonth();
  let year = tanggal.getFullYear();

  let all = `${date} ${month[monthIndex]} ${year}`;

  return all;
}

// function dateUnix(theDate) {
//   let bulan = [
//     '01',
//     '02',
//     '03',
//     '04',
//     '05',
//     '06',
//     '07',
//     '08',
//     '09',
//     '10',
//     '11',
//     '12',
//   ];
//   let date = theDate.getDate();
//   let monthIndex = theDate.getMonth();
//   let year = theDate.getFullYear();

//   let all = `${year}-${bulan[monthIndex]}-${date}`;

//   return all;
// }

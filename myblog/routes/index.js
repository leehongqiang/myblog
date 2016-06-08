
var cryto = require('crypto');
var User = require('../models/user.js'),
    Post = require('../models/Post.js'),
    Comment = require('../models/comment.js');


module.exports= function (app) {
  // '/'首页
  app.get('/', function (req,res) {
    //判断是否是第一页，并把请求的页数转换成number类型
    var page = parseInt(req.query.p)||1;
    console.log(page);
    Post.getTen(null,page, function (err,posts,total) {
      if(err){
        posts=[];
      }
      res.render('index',{
        title:"主页",
        posts:posts,
        page:page,
        isFirstPage:(page-1)==0,
        isLastPage:((page-1)*10+posts.length)==total,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      });
    });
  });
  // '/注册' 用户注册
  app.get('/reg',checkNotLogin);
  app.get('/reg', function (req,res) {
    res.render('reg',{
      title:"注册",
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/reg',checkNotLogin);
  app.post('/reg', function (req,res) {
    var name = req.body.username,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检查用户输入的密码是否一致
    if(password_re!= password){
      req.flash('error','两次输入的密码不一致！');
      return res.redirect('/reg');
    }
    //生成MD5密码
    var md5 = cryto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var md = cryto.createHash('md5'),
        email_MD = md.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://cn.gravatar.com/avatar/" + email_MD + "?s=48";
    var newUser = new  User({
        name:name,
        password:password,
        email:req.body.email,
        head:head
    });
    //检查用户是否存在
    User.get(newUser.name, function (err,user) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      if(user){
        req.flash('error','用户已存在！');
        return res.redirect('/reg');
      }
      //不存在新增用户
      newUser.save(function (err,user) {
        if(err){
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user = newUser;
        req.flash('success','注册成功');
        res.redirect('/');
      })
    })
  });

  // '/login'登录
  app.get('/login',checkNotLogin);
  app.get('/login', function (req,res) {
    res.render('login',{
      title:"登录",
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/login',checkNotLogin);
  app.post('/login', function (req,res) {
    var md5 = cryto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err,user) {
      if(!user){
        req.flash('error','用户不存在');
        return res.redirect('/login');
      }
      //检查密码是否一致
      if(user.password != password){
        req.flash('error','密码错误');
        return res.redirect('/login');
      }
      //用户名和密码正确，将用户信息存入session
      req.session.user = user;
      req.flash('success','登录成功');
      res.redirect('/');
    });
  });

  // 'post' 发表
  app.get('/post',checkLogin);
  app.get('/post', function (req,res) {
    res.render('post',{
      title:"发表",
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/post',checkLogin);
  app.post('/post', function (req,res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1,req.body.tag2,req.body.tag3],
        post = new Post(currentUser.name,currentUser.head,req.body.titles,tags,req.body.post);
    post.save(function (err) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      req.flash('success','发布成功');
      res.redirect('/');
    });
  });

  // 'logout' 登出
  app.get('/logout',checkLogin);
  app.get('/logout', function (req,res) {
    req.session.user = null;
    req.flash('success','登出成功！');
    res.redirect('/');
  });
  //上传功能
  app.get('/updata',checkLogin);
  app.get('/upload', function (req,res) {
    res.render('upload',{
      title:"上传",
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/upload',checkLogin);
  app.post('/upload', function (req,res) {
    req.flash('success','文件上传成功！');
    res.redirect('/upload');
  })
  //获取存档
  app.get('/archive', function (req,res) {
    Post.getArchive(function (err,posts) {
      if(err){
        req.flash("error",err);
        return  res.redirect('/');
      }
      res.render('archive',{
        title:"存档",
        posts:posts,
        user:req.session.user,
        success:req.flash("success").toString(),
        error:req.flash("error").toString()
      });
    });
  });
  //获取标签
  app.get('/tags', function (req,res) {
    Post.getTags(function (err,posts) {
      if(err){
        req.flash("error",err);
        return res.redirect('/');
      }
      res.render('tags',{
        title:"标签",
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      });
    });
  });

  //点击标签进入标签页
  app.get('/tags/:tag', function (req,res) {
    Post.getTag(req.params.tag, function (err,posts) {
      if(err){
        req.flash("error",err)
        return res.redirect('/');
      }
      res.render('tag',{
        title:'TAG:' + req.params.tag,
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      });
    });
  });
  app.get('/search', function (req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('search', {
        title: "SEARCH:" + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  //按指定规则获取文章
  app.get('/u/:name', function (req,res) {
    var page = parseInt(req.query.p) || 1;
    //检查用户是否存在
    User.get(req.params.name, function (err,user) {
      if(!user){
        req.flash('error',"用户不存在");
        return res.redirect('/');
      }
      //查询并返回该用户的第page页的10篇文章
      Post.getTen(user.name,page, function (err,posts,total) {
        if(err){
          req.flash('error',err);
          return res.redirect('/');
        }
        res.render('user',{
          title:user.name,
          posts:posts,
          page:page,
          isFirstPage:(page-1) == 0,
          isLastPage:((page-1)*10+posts.length) == total,
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()
        });
      });
    });
  });
  //文章页面

  app.get('/u/:name/:day/:title', function (req,res) {
    Post.getOne(req.params.name,req.params.day,req.params.title, function (err,post) {
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('article',{
        title:req.params.title,
        post:post,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      });
    });
  });
  //留言功能

  //app.post('/u/:name/:day/:title', checkLogin);
  app.post('/u/:name/:day/:title', function (req,res) {
    var data = new Date();
    var    time = data.getFullYear()+"-"+(data.getMonth()+1)+"-"+data.getDate()+" "+data.getHours()+
            ":"+(data.getMinutes()<10?'0'+data.getMinutes():data.getMinutes());
    var md5 = cryto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://cn.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var comment = {
      name: req.body.name,
      head: head,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
    };
    var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
    newComment.save(function (err) {
      if(err){
        req.flash("error",err);
        return res.redirect('back');
      }
      req.flash('succcess',"留言成功");
      res.redirect('back');
    });
  });
  //编辑

  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req,res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name,req.params.day,req.params.title, function (err,post) {
      if(err){
        req.flash('error',err);
        return res.redirect('back');
      }
      res.render('edit',{
        title:'编辑',
        post:post,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      });
    });
  });
  //保存修改
  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req,res) {
    var  currentUser = req.session.user;
    Post.update(currentUser.name,req.params.day,req.params.title,req.body.post, function (err) {
      var url = encodeURI('/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title);
      if(err){
        req.flash('error',err);
        return res.redirect(url);
      }
      req.flash('success',"修改成功");
      res.redirect(url);
    });
  });

  //删除
  app.get('/remove/:name/:day/:title',checkLogin);
  app.get('/remove/:name/:day/:title', function (req,res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name,req.params.day,req.params.title, function (err) {
      if(err){
        req.flash('error',err);
        return res.redirect('/back');
      }
      req.flash('success',"删除成功");
      res.redirect("/");
    })
  });
  //404
  app.use(function (req,res) {
    res.render('404');
  });
//检查未登录
  function checkLogin(req,res,next){
    if(!req.session.user){
      req.flash('error','未登录！');
      res.redirect('/login');
    }
    next();
  }
  function checkSameUser(req,res,next){
    if(!(req.params.name == req.session.user.name)){
      req.flash('error','不能修改别人的文章');
      res.redirect('/login');
    }
    next();
  }
//检查已登录
  function checkNotLogin(req,res,next){
    if(req.session.user){
      req.flash('error','已登录！');
      res.redirect('back');
    }
    next();
  }
};



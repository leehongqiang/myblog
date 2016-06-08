/**
 * Created by Administrator on 2016/3/30.
 */
//var mongodb = require('./db');
var crypto = require('crypto');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/blog');
//第一步先创建一个Schema,类似mysql表中定义字段
var userSchema = new mongoose.Schema({
    name:String,
    password:String,
    email:String,
    head:String
},{
    collection:'users'
});
//初始化创建一个模型
var userModel = mongoose.model('User',userSchema);
function User(user){
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
    this.head = user.head
};

User.prototype.save = function (callback) {
    var md5 = crypto.createHash('md5'),
        email_MD5= md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://cn.gravatar.com/avatar/"+email_MD5+"?s=48";
    var user = {
        name: this.name,
        password:this.password,
        email:this.email,
        head:head
    };
    //用过模型创建一个实体
    var newUser = new userModel(user);
    newUser.save(function (err,user) {
        if (err){
            return callback(err);
        }
        callback(null,user);
    });
};

User.get = function (name,callback) {
    userModel.findOne({name:name}, function (err,user) {
        if (err){
            return callback(err);
        }
        return callback(null,user)
    });
}
module.exports = User;
/*
function User(user){
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};

module.exports = User;
//存储用户信息

User.prototype.save = function (callback) {
    //要存入数据库的用户文档
    var md5 = crypto.createHash('md5'),
        email_MD5=md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://cn.gravatar.com/avatar/"+email_MD5+"?s=480";
    var user = {
        name: this.name,
        password: this.password,
        email: this.email,
        head:head
    };
    //打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);//err return
        }
        //读取 users集合
        db.collection('users', function (err,collection) {
            if (err){
                mongodb.close();
                return callback(err);
            }
            //将用户数据插入users集合
            collection.insert(user,{
                safe:true
            }, function (err,user) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,user[0])//成功，err为null并返回存储后的用户文档
            });
        });
    });
    //用户信息读取
};
User.get = function (name,callback) {
    //打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //读取users集合
        db.collection('users', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //查找用户名（name键）值为name一个文档
            collection.findOne({
                name:name
            }, function (err,user) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,user)//成功，返回查询的用户信息
            });
        });
    });
};
*/

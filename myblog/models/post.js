/**
 * Created by Administrator on 2016/3/30.
 */
var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name,head,title,tags,post){
    this.name = name;
    this.head = head;
    this.title = title;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

Post.prototype.save = function (callback) {
    var data = new  Date();
    //存储各种事件格式，方便以后扩展
    var time = {
        data:data,
        year:data.getFullYear(),
        month:data.getFullYear()+"-"+(data.getMonth()+1),
        day:data.getFullYear()+"-"+(data.getMonth()+1)+"-"+data.getDate(),
        minute:data.getFullYear()+"-"+(data.getMonth()+1)+"-"+data.getDate()+" "+data.getHours()+
        ":"+(data.getMinutes()<10?'0'+data.getMinutes():data.getMinutes())
    }
    //要存入数据库的文档
    var post = {
        name:this.name,
        head:this.head,
        time:time,
        title:this.title,
        tags:this.tags,
        post:this.post,
        comments:[],
        pv:0
    };
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将文档插入posts集合
            collection.insert(post,{safe:true}, function (err) {
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};



//读取文章 和其他相关信息
Post.getTen = function (name,page,callback) {
    //打开数据库
    mongodb.open(function (err,db) {
        if (err) {
            return callback(err);
        }
        //读取post集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //使用.count返回特定查询的文档数total
            collection.count(query, function (err, total) {
                //根据query对象查询，并跳过前（page-1）*10个结果，返回之后的10个结果
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    //解析markdown为HTML
                   /* docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });*/
                    callback(null, docs,total);
                });
            });
        });
    });
};


//获取一篇文章
Post.getOne = function (name,day,title,callback) {
    //打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用户名 发表日期 文章名进行查询
            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            }, function (err,doc) {
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                if (doc) {
                    //每次访问1次， PV+1
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    }, {$inc: {"pv": 1}}, function (err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });

                //解析markdown为HTML
               /* if (doc.comments) {
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                }*/
                callback(null,doc);// 返回查询的一篇文章
                }
            });
        });
    });
}
//返回原始发表的内容

Post.edit = function (name,day,title,callback) {
    //打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用户名发布日期 文章明进行查询
            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            }, function (err,doc) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,doc);
            });
        });
    });
}

//更新一篇文章以及相关信息
Post.update = function (name,day,title,post,callback) {
    //打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //更新文章内容
            collection.update({
                "name":name,
                "time.day":day,
                "title":title},
                {$set:{post:post}},
                function (err) {
                mongodb.close();
                if(err){
                   return callback(err)
                }
                callback(null);
            });
        });
    });
}

//删除一篇文章
Post.remove = function (name,day,title,callback) {
    //打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            // 根据用户名，日期，标题查找并删除文章
            collection.remove({
                "name":name,
                "time.day":day,
                "title":title
            },{w:1}, function (err) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}

//返回所有文章存档信息

Post.getArchive = function (callback) {
    //打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //返回只包含 name、time、title属性的文档组成的存档数组
            collection.find({},{
                "name":1,
                "time":1,
                "title":1
            }).sort({time:-1}).toArray(function (err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
}
//返回所有标签
Post.getTags = function (callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //distinct用来找出给定键的所有不同值
            collection.distinct('tags', function (err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
}

//获取特定标签的所有文章

Post.getTag = function (tag,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts', function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //查询素有tags数组内包含tag的文档、并返回只含有name、time、title组成的数组
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({time:-1}).toArray(function (err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
}


//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

// Run this when the meteor app is started
config = new Object();
DB = {};

Meteor.startup(function () {
    DB.Service = new Mongo.Collection("Service");
    DB.AlertPolicy = new Mongo.Collection("AlertPolicy");
    DB.Host = new Mongo.Collection('Host');
});


// 弹层的管理
layerManager = {};
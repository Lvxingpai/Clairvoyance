// Run this when the meteor app is started
config = new Object();
config.db = {};

Meteor.startup(function () {
  config.db.Service = new Mongo.Collection("Service");
  config.db.AlertPolicy = new Mongo.Collection("AlertPolicy");
});


// 弹层的管理
layerManager = {};
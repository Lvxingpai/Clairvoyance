process.env.MAIL_URL = "smtp://316322415%40qq.com:cjy910823@smtp.qq.com:465/";

// 所有配置项
var Config = function() {	
	this.ETCD_URL = process.env.ETCD_URL;
	this.db = {};
	this.db.Service = new Mongo.Collection('Service', {idGeneration: 'MONGO'});
	this.db.AlertPolicy = new Mongo.Collection('AlertPolicy', {idGeneration: 'MONGO'});
}
config = new Config();
var Future = Npm.require('fibers/future');

/**
 * EtcdBuilder
 * @param entries etcd服务器入口. 有两种形式: "192.168.100.2:2379"这样的字符串, 或者["192.168.100.2:2379"]这样的数组.
 * @constructor
 */
var EtcdConfBuilder = function (entries) {
    if (typeof entries == "string")
        this.entries = [entries];
    else if (Array.isArray(entries))
        this.entries = entries;
    else
        throw("Invalid etcd server entries");

    /**
     * 需要获得的配置key列表
     * @type {Array}
     */
    this.confList = [];

    /**
     * 添加服务项目
     * @param conf 需要添加的配置key. 有两种形式: "nebula", 或者["nebula", "nebulaAlias"]. 或者提供了别名机制.
     */
    this.addConfig = function (conf) {
        if (typeof conf == "string")
            this.confList.push([conf, conf]);
        else if (Array.isArray(conf))
            this.confList.push(conf);
        else
            throw("Invalid config entry");
    };

    /**
     * 访问etcd服务器, 获得单个的配置项. 需要注意的是, etcd服务器的地址由this.entries指定, 可能不止一个节点.
     * @param confEntry 需要访问的配置项. 格式为: [ key, alias ]
     * @param args 选项. 包括: recursive=true (是否采用递归形式)
     * @return {*} Future对象. 内容: { key: 配置项名称, config: 配置项内容 }
     * @private
     */
    this._buildSingleConf = function (confEntry, args) {
        var builder = this;
        var serverEntries = builder.entries;

        var key = confEntry[0];
        var alias = confEntry[1];

        // 建立配置项的url列表
        var recursive = false;
        if (args.recursive == undefined)
            recursive = true;
        else if (args.recursive)
            recursive = true;

        var urls = _.map(serverEntries, function (serverEntry) {
            var etcd_url = "http://" + serverEntry + "/v2/keys/project-conf/" + key;
            if (recursive)
                etcd_url = etcd_url + "?recursive=true";
            return etcd_url;
        });

        var future = ClairHttp.clusterHttpGet(urls);
        //var future = builder._clusteredHttpCall(urls);
        var target = new Future();
        future.resolve(function (err, data) {
            if (err) {
                target.throw(err);
            } else {
                var ret = {"key": alias, "config": data};
                target.return(ret);
            }
        });
        return target;
    };

    /**
     * 从etcd服务器获得配置
     */
    this.buildConfig = function () {
        var builder = this;
        var futures = _.map(builder.confList, function (confEntry) {
            console.log("Getting config: " + confEntry[0]);
            return builder._buildSingleConf(confEntry, {recursive: true});
        });
        Future.wait(futures);
        _.each(futures, function (future) {
            console.log(future.get());
        });
    }
};


var builder = new EtcdConfBuilder(["192.168.100.3:2379", "192.168.100.2:2479"]);
builder.addConfig("yunkai");
builder.addConfig(["hedylogos", "hedy"]);
builder.addConfig(["k2-dev", "k2"]);
builder.buildConfig();


// 所有配置项
var Config = function () {
    this.ETCD_URL = process.env.ETCD_URL;
    this.db = {};
    this.db.Service = new Mongo.Collection('Service', {idGeneration: 'MONGO'});
    this.db.AlertPolicy = new Mongo.Collection('AlertPolicy', {idGeneration: 'MONGO'});
}
config = new Config();
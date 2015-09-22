/**
 * etcd服务器工具类
 * Created by zephyre on 9/19/15.
 */

var sprintf = Meteor.npmRequire("sprintf-js").sprintf;
var Future = Npm.require('fibers/future');


EtcdHelper = (function () {
    var EtcdBaseBuilder = function (serverAddresses) {
        if (serverAddresses == undefined) {
            this.serverAddresses = [];
        } else if (typeof serverAddresses == "string")
            this.serverAddresses = [serverAddresses];
        else if (Array.isArray(serverAddresses))
            this.serverAddresses = serverAddresses;
        else
            throw("Invalid etcd server entries");

        /**
         * 需要获取的key列表. 形式: [ ["key", "alias"] ]
         * @type {Array}
         */
        this.entries = [];

        /**
         * 添加服务项目
         * @param entry 需要添加的配置key. 有两种形式: "nebula", 或者["nebula", "nebulaAlias"]. 或者提供了别名机制.
         */
        this.addEntry = function (entry) {
            if (typeof entry == "string")
                this.entries.push([entry, entry]);
            else if (Array.isArray(entry))
                this.entries.push(entry);
            else
                throw("Invalid config entry");
        };

        /**
         * future对象只包含了etcd的返回结果. 需要将其和alias关联起来
         * @param alias
         * @param future
         * @private
         */
        this._bindAlias = function (alias, future) {
            var target = new Future();
            future.resolve(function (err, data) {
                if (err) {
                    target.throw(err);
                } else {
                    target.return({"key": alias, "data": data.data});
                }
            });
            return target;
        };

        this._errback = function (error, data) {
            if (data != null && data != undefined && data.statusCode == 404) {
                return {rescued: true, data: data};
            } else {
                return {rescued: false};
            }
        };
    };

    /**
     * 从etcd服务器获得配置项目的类
     * @param serverAddresses
     * @constructor
     */
    var EtcdConfigBuilder = function (serverAddresses) {

        EtcdBaseBuilder.apply(this, [serverAddresses]);

        /**
         * 向配置对象中写入一个键值对
         * @param object 待写入的配置对象
         * @param keyPath 有两种形式: "key", 和普通的写入一样. ["p1", "p2", "p3"]: 往o.p1.p2.p3中写入值
         * @param value
         */
        var _setConfig = function (object, keyPath, value) {
            if (typeof keyPath == "string") {
                object[keyPath] = value;
            } else if (_.isArray(keyPath) && keyPath.length > 0) {
                var thisObj = object;
                for (var i = 0; i < keyPath.length; i++) {
                    var term = keyPath[i];
                    if (i == keyPath.length - 1) {
                        // 到达叶节点
                        thisObj[term] = value;
                    } else {
                        if (thisObj[term] == undefined) {
                            thisObj[term] = {};
                        }
                        thisObj = thisObj[term];
                    }
                }
            }
        };

        /**
         * 从配置文件中读出一个键值对
         * @param object
         * @param keyPath
         * @private
         */
        var _getConfig = function (object, keyPath) {
            if (keyPath.length == 0 || object == undefined) {
                return object;
            } else {
                var key = _.first(keyPath);
                keyPath = _.tail(keyPath);
                return _getConfig(object[key], keyPath);
            }
        };

        /**
         * 将source合并到target中
         * @param target
         * @param source
         * @private
         */
        var _mergeConfig = function (target, source) {

            // 递归寻找source的叶节点
            var walk = function (object, keyPath) {
                if (keyPath == undefined) {
                    keyPath = [];
                }

                if (_.isArray(object)) {
                    // 到达数组型叶节点, 合并
                    var ret = _getConfig(object, keyPath);
                    if (_.isArray(ret)) {
                        _.union(ret, object);
                    } else {
                        // 直接写入
                        _setConfig(target, keyPath, object);
                    }
                } else if (_.isObject(object)) {
                    // 未到叶节点, 递归
                    _.each(_.keys(object), function (key) {
                        var newKeyPath = keyPath.slice();
                        newKeyPath.push(key);
                        walk(object[key], newKeyPath);
                    });
                } else {
                    // 到达普通叶节点, 合并
                    _setConfig(target, keyPath, object);
                }
            };

            walk(source);
        };

        /**
         * 处理etcd返回的原始数据, 生成字典形式的config对象
         * @param data
         * @private
         */
        var _process = function (data) {

            /**
             * 处理一个node. 如果该node是叶节点, 则返回其值, 否则, 递归调用.
             * @param node
             */
            var func = function (node) {
                if (node == undefined) {
                    return {_: undefined};
                }
                var nodeKey = _.last(node.key.split("/"));

                var masterNode = {};

                if (Array.isArray(node.nodes) && node.nodes.length > 0) {
                    var nodeValues = _.map(node.nodes, function (val) {
                        return func(val);
                    });
                    var o = {};
                    _.each(nodeValues, function (val) {
                        var key = _.first(_.keys(val));
                        o[key] = val[key];
                    });
                    masterNode[nodeKey] = o;
                    return masterNode;
                } else {
                    masterNode[nodeKey] = node.value;
                    return masterNode;
                }
            };

            var ret = func(data.node);
            return _.first(_.values(ret));
        };


        /**
         * 获得etcd的配置数据
         */
        this.build = function () {
            var builder = this;
            var futures = _.map(builder.entries, function (entry) {
                var key = entry[0];
                var alias = entry[1];
                var urls = _.map(builder.serverAddresses, function (addr) {
                    return sprintf("http://%s/v2/keys/project-conf/%s?recursive=true", addr, key);
                });
                return builder._bindAlias(alias, ClairHttp.clusteredHttpGet(urls, undefined, builder._errback));
            });

            // 将各个配置项的结果汇总
            var config = {};
            _.each(futures, function (future) {
                future.wait();
                var ret = future.get();
                var key = ret.key;
                var o = {};
                o[key] = _process(ret.data);
                _mergeConfig(config, o);
            });

            return config;
        }
    };
    EtcdConfigBuilder.prototype = new EtcdBaseBuilder([]);
    EtcdConfigBuilder.prototype.constructor = EtcdConfigBuilder;

    var EtcdServiceBuilder = function (serverAddresses) {
        EtcdBaseBuilder.apply(this, [serverAddresses]);

        var _process = function (data) {
            if (data.node == undefined) {
                return undefined;
            }
            var nodes = data.node.nodes;
            if (nodes == undefined) {
                nodes = [];
            }
            var nodeEntries = _.map(nodes, function (node) {
                var hash = _.last(node.key.split("/"));
                var tmp = node.value.split(":");
                var host = tmp[0];
                var port = tmp[1];
                return [hash, {host: host, port: parseInt(port)}];
            });
            return _.reduce(nodeEntries, function (memo, entry) {
                memo[entry[0]] = entry[1];
                return memo;
            }, {});
        };

        /**
         * 获得etcd的配置数据
         */
        this.build = function () {
            var builder = this;
            var futures = _.map(builder.entries, function (entry) {
                var key = entry[0];
                var alias = entry[1];
                var urls = _.map(builder.serverAddresses, function (addr) {
                    return sprintf("http://%s/v2/keys/backends/%s?recursive=true", addr, key);
                });
                return builder._bindAlias(alias, ClairHttp.clusteredHttpGet(urls, undefined, builder._errback));
            });

            // 将各个配置项的结果汇总
            return _.reduce(futures, function (memo, future) {
                future.wait();
                var ret = future.get();
                var key = ret.key;
                memo[key] = _process(ret.data);
                return memo;
            }, {});
        }

    };
    EtcdServiceBuilder.prototype = new EtcdBaseBuilder([]);
    EtcdServiceBuilder.prototype.constructor = EtcdServiceBuilder;


    return {
        "EtcdServiceBuilder": EtcdServiceBuilder,
        "EtcdConfigBuilder": EtcdConfigBuilder
    };

})();

var test = function() {
    var builder = new EtcdHelper.EtcdConfigBuilder(["192.168.100.2:2379", "192.168.100.4:1379"]);
    builder.addEntry(["yunkai1", "yunkai"]);
    builder.addEntry(["yunkai", "yunkai"]);
    builder.addEntry(["k2-dev", "k2"]);
    builder.addEntry(["hedylogos-base", "hedy"]);
    builder.addEntry(["hedylogos", "hedy"]);
    var config = builder.build();
    console.log(config);

    var services = new EtcdHelper.EtcdServiceBuilder("192.168.100.2:2379");
    services.addEntry(["mongo-production1", "mongo"]);
    services.addEntry(["redis-main", "redis"]);
    var backends = services.build();
    console.log(backends);
}

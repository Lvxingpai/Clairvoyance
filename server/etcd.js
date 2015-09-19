// 封装etcd相关的函数
// input:ETCD_URL, path
// output:对应的[] => 有可能只有一个值，有可能有多个值，有可能为空 

EtcdClass = function (etcdUrl) {
    this.url = etcdUrl;

    // 从etcd获取数据
    this.callEtcd = function (dir) {
        try {
            var callUrl = this.url + '/v2/keys/' + dir + '?recursive=true';
            return HTTP.call('GET', callUrl).data.node;
        } catch (e) {
            console.log("Failed in getting settings : " + callUrl);
            console.log(e);
        }
        return false;
    };

    /**
     * 返回目标节点的key和val; 当给的是完全匹配的路径(path)时，
     * @param  {string} path   目标节点所对应的绝对路径，如: /project-conf/tasman/dbauth/geo/db
     * @param  {object} obj 当前节点
     * @return {string}        对应的value值
     */
    this.getNode = function (path, obj) {
        // 当前节点为目标节点
        if (path === obj.key) {
            if (!obj.dir) {
                return {
                    key: obj.key,
                    value: obj.value
                };
            } else {
                // 假如是文件夹，说明需要返回数组
                return this.getNodes(obj.nodes);
            }
        }

        // 当前节点并无key值(根节点...，可忽略)
        if (!obj.key && obj.node) {
            return this.getNode(path, obj.node);
        }

        // 当前节点为目标节点的父节点
        if (this._isPar(path, obj)) {
            if (!this._isNull(obj)) {
                // 父节点下有多个节点，找其中一个节点 例如：/backends/docker-registry/76b209ab46b5d6aeb5080c8ff4891a30f9999468bf372a3144b643bf9991b610
                for (var i = 0; i < obj.nodes.length; i++) {
                    var node = this.getNode(path, obj.nodes[i]);
                    if (node)
                        return node;
                }
            } else {
                // nodes不存在或者为空
                // TODO 报错failuier
                return false;
            }
        }

        return false;
    };

    this._isNull = function (obj) {
        return !(obj.nodes && obj.nodes.length > 0)
    };

    this._isPar = function (path, obj) {
        return (obj.dir && path.indexOf(obj.key) > -1);
    };

    /**
     * 获取一组节点
     * @param  {object} nodes [description]
     * @return {array}        [description]
     */
    this.getNodes = function (nodes) {
        var result = [];
        nodes.map(function (node) {
            result.push(node);
        });
        return result;
    };

    /**
     * 根据服务名称，获取服务的可用节点
     * @param  {String} name [description]
     * @return {[type]}      [description]
     */
    this.getServiceNode = function (name) {
        var servicePath = '/backends/' + name;
        return Etcd.getNode(servicePath, Etcd.data['backends']);
    };
};

// 获取etcd的后台服务列表, 单例模式
Etcd = new EtcdClass(config.ETCD_URL);
_.extend(Etcd, {
    data: {
        'project-conf': Etcd.callEtcd('project-conf'),
        'backends': Etcd.callEtcd('backends')
    }
})

// 检查etcd的后台服务列表是否为空
if (!Etcd.data['backends']) {
    console.log('未获取到后台服务列表，请检查etcd！');
}


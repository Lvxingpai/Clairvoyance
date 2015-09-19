/**
 * Clairvoyance使用的HTTP方法封装
 * Created by zephyre on 9/19/15.
 */
ClairHttp = (function () {
    var Future = Npm.require('fibers/future');

    /**
     * 以GET形式, 访问urls列表, 并返回第一个成功的响应(Future形式).
     * @param urls
     * @returns {*}
     */
    var clusterHttpGet = function (urls) {
        var future = new Future();

        // 改写callback
        var modCallback = function (error, result) {
            if (error) {
                console.log("Error occured: " + error);
                if (urls.length > 0) {
                    // 尝试新的服务端口
                    var url = urls.pop();
                    console.log("Try another url: " + url);
                    HTTP.get(url, modCallback);
                } else {
                    console.log("Throwing: " + error);
                    future.throw(error);
                }
            } else {
                console.log("Success: " + result);
                future.return(result);
            }
        };

        var url = urls.pop();
        console.log("Fetching: " + url);
        HTTP.get(url, modCallback);

        return future;
    };

    return {
        "clusterHttpGet": clusterHttpGet
    };

})();
